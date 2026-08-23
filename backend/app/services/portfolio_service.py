from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import AppError
from app.data.demo_bonds import DEMO_BONDS, DEMO_PORTFOLIO_POSITIONS
from app.models import Bond, Portfolio, PortfolioPosition
from app.schemas.bond import BondReferenceData
from app.schemas.portfolio import PortfolioCreate, PortfolioDetail, PortfolioRead, PortfolioUpdate
from app.schemas.position import PositionCreate, PositionRead, PositionUpdate
from app.services.bond_search_service import BondSearchService
from app.utils.finance import market_value, valuation_price


class PortfolioService:
    def __init__(self, db: Session, bond_service: BondSearchService) -> None:
        self.db = db
        self.bond_service = bond_service

    def list_portfolios(self) -> list[PortfolioRead]:
        portfolios = self.db.scalars(select(Portfolio).order_by(Portfolio.created_at.asc())).all()
        return [PortfolioRead.model_validate(portfolio) for portfolio in portfolios]

    def create_portfolio(self, payload: PortfolioCreate) -> PortfolioRead:
        portfolio = Portfolio(name=payload.name)
        self.db.add(portfolio)
        self.db.commit()
        self.db.refresh(portfolio)
        return PortfolioRead.model_validate(portfolio)

    def update_portfolio(self, portfolio_id: int, payload: PortfolioUpdate) -> PortfolioRead:
        portfolio = self._get_portfolio_model(portfolio_id)
        portfolio.name = payload.name
        self.db.add(portfolio)
        self.db.commit()
        self.db.refresh(portfolio)
        return PortfolioRead.model_validate(portfolio)

    def ensure_demo_portfolio(self) -> PortfolioRead:
        existing = self.db.scalar(select(Portfolio).where(Portfolio.name == "Indian Bond Portfolio - Demo"))
        if existing:
            return PortfolioRead.model_validate(existing)

        for demo_bond in DEMO_BONDS:
            self.bond_service.upsert_bond(demo_bond)

        portfolio = Portfolio(name="Indian Bond Portfolio - Demo")
        self.db.add(portfolio)
        self.db.flush()

        for item in DEMO_PORTFOLIO_POSITIONS:
            bond = self.db.scalar(select(Bond).where(Bond.isin == item["isin"]))
            if not bond:
                continue
            self.db.add(
                PortfolioPosition(
                    portfolio_id=portfolio.id,
                    bond_id=bond.id,
                    quantity=Decimal(str(item["quantity"])),
                    purchase_price=(
                        Decimal(str(item["purchase_price"])) if item.get("purchase_price") is not None else None
                    ),
                    manual_current_price=(
                        Decimal(str(item["manual_current_price"]))
                        if item.get("manual_current_price") is not None
                        else None
                    ),
                )
            )
        self.db.commit()
        self.db.refresh(portfolio)
        return PortfolioRead.model_validate(portfolio)

    def get_portfolio(self, portfolio_id: int) -> PortfolioDetail:
        portfolio = self._get_portfolio_model(portfolio_id)
        positions = self._position_reads(portfolio.positions)
        return PortfolioDetail(
            id=portfolio.id,
            name=portfolio.name,
            created_at=portfolio.created_at,
            updated_at=portfolio.updated_at,
            positions=positions,
        )

    def delete_portfolio(self, portfolio_id: int) -> None:
        result = self.db.execute(delete(Portfolio).where(Portfolio.id == portfolio_id))
        if result.rowcount == 0:
            raise AppError("Portfolio not found", status_code=404, code="not_found")
        self.db.commit()

    async def add_position(self, portfolio_id: int, payload: PositionCreate) -> PositionRead:
        self._get_portfolio_model(portfolio_id)
        if bool(payload.isin) == bool(payload.bond):
            raise AppError("Provide either an ISIN or manual bond details", status_code=422, code="invalid_position")

        if payload.bond:
            bond = self.bond_service.upsert_bond(BondReferenceData(**payload.bond.model_dump()))
        else:
            reference = await self.bond_service.get_bond(payload.isin or "")
            if not reference:
                raise AppError("Bond reference data not found", status_code=404, code="bond_not_found")
            bond = self.bond_service.upsert_bond(reference)

        position = PortfolioPosition(
            portfolio_id=portfolio_id,
            bond_id=bond.id,
            quantity=payload.quantity,
            purchase_price=payload.purchase_price,
            purchase_date=payload.purchase_date,
            manual_current_price=payload.manual_current_price,
        )
        self.db.add(position)
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise AppError("This bond already exists in the portfolio", status_code=409, code="duplicate_position") from exc
        self.db.refresh(position)
        return self._position_read(position)

    def update_position(self, portfolio_id: int, position_id: int, payload: PositionUpdate) -> PositionRead:
        position = self._get_position_model(portfolio_id, position_id)
        updates = payload.model_dump(exclude_unset=True)
        for field, value in updates.items():
            setattr(position, field, value)
        self.db.add(position)
        self.db.commit()
        self.db.refresh(position)
        return self._position_read(position)

    def delete_position(self, portfolio_id: int, position_id: int) -> None:
        position = self._get_position_model(portfolio_id, position_id)
        self.db.delete(position)
        self.db.commit()

    def _get_portfolio_model(self, portfolio_id: int) -> Portfolio:
        portfolio = self.db.scalar(
            select(Portfolio)
            .where(Portfolio.id == portfolio_id)
            .options(selectinload(Portfolio.positions).selectinload(PortfolioPosition.bond))
        )
        if not portfolio:
            raise AppError("Portfolio not found", status_code=404, code="not_found")
        return portfolio

    def _get_position_model(self, portfolio_id: int, position_id: int) -> PortfolioPosition:
        position = self.db.scalar(
            select(PortfolioPosition)
            .where(
                PortfolioPosition.portfolio_id == portfolio_id,
                PortfolioPosition.id == position_id,
            )
            .options(selectinload(PortfolioPosition.bond))
        )
        if not position:
            raise AppError("Position not found", status_code=404, code="not_found")
        return position

    def _position_reads(self, positions: list[PortfolioPosition]) -> list[PositionRead]:
        reads = [self._position_read(position) for position in positions]
        total = sum((read.market_value for read in reads), Decimal("0"))
        if total > 0:
            reads = [
                read.model_copy(update={"portfolio_weight_percent": (read.market_value / total * Decimal("100")).quantize(Decimal("0.01"))})
                for read in reads
            ]
        return reads

    @staticmethod
    def _position_read(position: PortfolioPosition) -> PositionRead:
        price, source = valuation_price(
            position.bond.latest_price,
            position.manual_current_price,
            position.purchase_price,
            position.bond.face_value,
        )
        value = market_value(position.quantity, price)
        return PositionRead(
            id=position.id,
            portfolio_id=position.portfolio_id,
            bond=position.bond,
            quantity=position.quantity,
            purchase_price=position.purchase_price,
            purchase_date=position.purchase_date,
            manual_current_price=position.manual_current_price,
            valuation_price=price,
            valuation_price_source=source,
            market_value=value,
            created_at=position.created_at,
            updated_at=position.updated_at,
        )
