from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import case, func, literal, select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models import Bond, Portfolio, PortfolioPosition
from app.schemas.analytics import (
    ExposureItem,
    GainLossItem,
    GainLossSummary,
    MaturityBucket,
    MetricWithCoverage,
    PortfolioAnalytics,
    TopPosition,
)
from app.utils.finance import money, percent


class AnalyticsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_portfolio_analytics(self, portfolio_id: int) -> PortfolioAnalytics:
        self._ensure_portfolio(portfolio_id)
        total_value = self._portfolio_value(portfolio_id)
        position_count = self._position_count(portfolio_id)
        nearest, furthest = self._maturity_range(portfolio_id)

        return PortfolioAnalytics(
            portfolio_id=portfolio_id,
            position_count=position_count,
            portfolio_value=money(total_value),
            weighted_coupon=percent(self._weighted_metric(portfolio_id, Bond.coupon_rate, Bond.coupon_rate.is_not(None), total_value)),
            weighted_yield=self._weighted_metric_with_coverage(portfolio_id, Bond.latest_yield, Bond.latest_yield.is_not(None), total_value),
            weighted_duration=self._weighted_metric_with_coverage(portfolio_id, Bond.duration, Bond.duration.is_not(None), total_value),
            portfolio_dv01=money(self._portfolio_dv01(portfolio_id)),
            gain_loss=self._gain_loss_summary(portfolio_id, total_value),
            nearest_maturity=nearest,
            furthest_maturity=furthest,
            rating_exposure=self._exposure(portfolio_id, func.coalesce(func.nullif(Bond.credit_rating, ""), "Unrated / Unknown")),
            sector_exposure=self._exposure(portfolio_id, func.coalesce(func.nullif(Bond.sector, ""), "Other")),
            issuer_exposure=self._exposure(portfolio_id, Bond.issuer, limit=6, include_other=True),
            maturity_distribution=self._maturity_distribution(portfolio_id),
            gain_loss_contributors=self._gain_loss_contributors(portfolio_id),
            top_positions=self._top_positions(portfolio_id, total_value),
        )

    @staticmethod
    def valuation_price_expr():
        return func.coalesce(
            PortfolioPosition.manual_current_price,
            Bond.latest_price,
            PortfolioPosition.purchase_price,
            Bond.face_value,
        )

    @staticmethod
    def valuation_source_expr():
        return case(
            (PortfolioPosition.manual_current_price.is_not(None), "manual current price per unit"),
            (Bond.latest_price.is_not(None), "provider market price per unit"),
            (PortfolioPosition.purchase_price.is_not(None), "purchase price per unit"),
            else_="face value fallback",
        )

    @classmethod
    def market_value_expr(cls):
        return PortfolioPosition.quantity * cls.valuation_price_expr()

    @staticmethod
    def cost_basis_expr():
        return PortfolioPosition.quantity * PortfolioPosition.purchase_price

    @classmethod
    def gain_loss_expr(cls):
        return cls.market_value_expr() - cls.cost_basis_expr()

    def _base_join(self, portfolio_id: int):
        return (
            select()
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(PortfolioPosition.portfolio_id == portfolio_id)
        )

    def _portfolio_value(self, portfolio_id: int) -> Decimal:
        statement = (
            select(func.coalesce(func.sum(self.market_value_expr()), literal(0)))
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(PortfolioPosition.portfolio_id == portfolio_id)
        )
        return Decimal(str(self.db.scalar(statement) or 0))

    def _position_count(self, portfolio_id: int) -> int:
        statement = select(func.count()).where(PortfolioPosition.portfolio_id == portfolio_id)
        return int(self.db.scalar(statement) or 0)

    def _weighted_metric(self, portfolio_id: int, metric, eligibility, denominator: Decimal) -> Decimal | None:
        if denominator <= 0:
            return None
        numerator = self.db.scalar(
            select(func.sum(self.market_value_expr() * metric))
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(PortfolioPosition.portfolio_id == portfolio_id, eligibility)
        )
        if numerator is None:
            return None
        return Decimal(str(numerator)) / denominator

    def _weighted_metric_with_coverage(self, portfolio_id: int, metric, eligibility, total_value: Decimal) -> MetricWithCoverage:
        eligible_value = self.db.scalar(
            select(func.coalesce(func.sum(self.market_value_expr()), literal(0)))
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(PortfolioPosition.portfolio_id == portfolio_id, eligibility)
        )
        eligible_decimal = Decimal(str(eligible_value or 0))
        value = self._weighted_metric(portfolio_id, metric, eligibility, eligible_decimal)
        coverage = Decimal("0") if total_value <= 0 else eligible_decimal / total_value * Decimal("100")
        return MetricWithCoverage(value=percent(value), coverage_percent=percent(coverage) or Decimal("0"))

    def _portfolio_dv01(self, portfolio_id: int) -> Decimal:
        return Decimal(
            str(
                self.db.scalar(
                    select(func.coalesce(func.sum(self.market_value_expr() * Bond.duration * Decimal("0.0001")), literal(0)))
                    .select_from(PortfolioPosition)
                    .join(Bond, Bond.id == PortfolioPosition.bond_id)
                    .where(PortfolioPosition.portfolio_id == portfolio_id, Bond.duration.is_not(None))
                )
                or 0
            )
        )

    def _gain_loss_summary(self, portfolio_id: int, total_value: Decimal) -> GainLossSummary:
        row = self.db.execute(
            select(
                func.coalesce(func.sum(self.cost_basis_expr()), literal(0)),
                func.coalesce(func.sum(self.gain_loss_expr()), literal(0)),
                func.coalesce(func.sum(self.market_value_expr()), literal(0)),
            )
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(
                PortfolioPosition.portfolio_id == portfolio_id,
                PortfolioPosition.purchase_price.is_not(None),
            )
        ).one()
        cost_basis = Decimal(str(row[0] or 0))
        gain_loss = Decimal(str(row[1] or 0))
        eligible_value = Decimal(str(row[2] or 0))
        gain_loss_percent = None if cost_basis <= 0 else gain_loss / cost_basis * Decimal("100")
        coverage = Decimal("0") if total_value <= 0 else eligible_value / total_value * Decimal("100")
        return GainLossSummary(
            total_cost_basis=money(cost_basis),
            unrealized_gain_loss=money(gain_loss),
            unrealized_gain_loss_percent=percent(gain_loss_percent),
            coverage_percent=percent(coverage) or Decimal("0"),
        )

    def _maturity_range(self, portfolio_id: int) -> tuple[date | None, date | None]:
        statement = (
            select(func.min(Bond.maturity_date), func.max(Bond.maturity_date))
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(PortfolioPosition.portfolio_id == portfolio_id)
        )
        row = self.db.execute(statement).one()
        return row[0], row[1]

    def _exposure(self, portfolio_id: int, label, limit: int | None = None, include_other: bool = False) -> list[ExposureItem]:
        total = self._portfolio_value(portfolio_id)
        if total <= 0:
            return []
        statement = (
            select(label.label("name"), func.sum(self.market_value_expr()).label("market_value"))
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(PortfolioPosition.portfolio_id == portfolio_id)
            .group_by(label)
            .order_by(func.sum(self.market_value_expr()).desc())
        )
        rows = self.db.execute(statement).all()
        if include_other and limit and len(rows) > limit:
            visible = rows[: limit - 1]
            other_value = sum((Decimal(str(row.market_value)) for row in rows[limit - 1 :]), Decimal("0"))
            rows = [*visible, ("Other", other_value)]

        return [
            ExposureItem(
                name=str(row[0]),
                market_value=money(Decimal(str(row[1]))),
                percent=percent(Decimal(str(row[1])) / total * Decimal("100")) or Decimal("0"),
            )
            for row in rows
        ]

    def _maturity_distribution(self, portfolio_id: int) -> list[MaturityBucket]:
        total = self._portfolio_value(portfolio_id)
        if total <= 0:
            return []
        today = date.today()
        one_year = today + timedelta(days=365)
        three_years = today + timedelta(days=365 * 3)
        five_years = today + timedelta(days=365 * 5)
        ten_years = today + timedelta(days=365 * 10)
        bucket = case(
            (Bond.maturity_date < one_year, "< 1 year"),
            (Bond.maturity_date < three_years, "1-3 years"),
            (Bond.maturity_date < five_years, "3-5 years"),
            (Bond.maturity_date < ten_years, "5-10 years"),
            else_="10+ years",
        )
        statement = (
            select(bucket.label("bucket"), func.sum(self.market_value_expr()).label("market_value"))
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(PortfolioPosition.portfolio_id == portfolio_id)
            .group_by(bucket)
        )
        values = {row.bucket: Decimal(str(row.market_value)) for row in self.db.execute(statement).all()}
        order = ["< 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"]
        return [
            MaturityBucket(
                bucket=name,
                market_value=money(values.get(name, Decimal("0"))),
                percent=percent(values.get(name, Decimal("0")) / total * Decimal("100")) or Decimal("0"),
            )
            for name in order
        ]

    def _gain_loss_contributors(self, portfolio_id: int) -> list[GainLossItem]:
        statement = (
            select(
                PortfolioPosition.id,
                Bond.isin,
                Bond.issuer,
                Bond.security_name,
                self.market_value_expr().label("market_value"),
                self.cost_basis_expr().label("cost_basis"),
                self.gain_loss_expr().label("gain_loss"),
                (self.gain_loss_expr() / func.nullif(self.cost_basis_expr(), 0) * Decimal("100")).label("gain_loss_percent"),
            )
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(
                PortfolioPosition.portfolio_id == portfolio_id,
                PortfolioPosition.purchase_price.is_not(None),
                PortfolioPosition.purchase_price > 0,
            )
            .order_by(func.abs(self.gain_loss_expr()).desc())
            .limit(8)
        )
        return [
            GainLossItem(
                position_id=row[0],
                isin=row[1],
                issuer=row[2],
                security_name=row[3],
                market_value=money(Decimal(str(row[4]))),
                cost_basis=money(Decimal(str(row[5]))),
                unrealized_gain_loss=money(Decimal(str(row[6]))),
                unrealized_gain_loss_percent=percent(row[7]) or Decimal("0"),
            )
            for row in self.db.execute(statement).all()
        ]

    def _top_positions(self, portfolio_id: int, total_value: Decimal) -> list[TopPosition]:
        if total_value <= 0:
            return []
        statement = (
            select(
                PortfolioPosition.id,
                Bond.id,
                Bond.isin,
                Bond.issuer,
                Bond.security_name,
                Bond.coupon_rate,
                Bond.maturity_date,
                Bond.credit_rating,
                Bond.latest_yield,
                Bond.duration,
                self.market_value_expr().label("market_value"),
                self.cost_basis_expr().label("cost_basis"),
                self.gain_loss_expr().label("gain_loss"),
                (self.gain_loss_expr() / func.nullif(self.cost_basis_expr(), 0) * Decimal("100")).label("gain_loss_percent"),
                self.valuation_source_expr().label("valuation_price_source"),
            )
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(PortfolioPosition.portfolio_id == portfolio_id)
            .order_by(self.market_value_expr().desc())
            .limit(10)
        )
        return [
            TopPosition(
                position_id=row[0],
                bond_id=row[1],
                isin=row[2],
                issuer=row[3],
                security_name=row[4],
                coupon_rate=row[5],
                maturity_date=row[6],
                credit_rating=row[7],
                latest_yield=row[8],
                duration=row[9],
                market_value=money(Decimal(str(row[10]))),
                cost_basis=money(Decimal(str(row[11]))) if row[11] is not None else None,
                unrealized_gain_loss=money(Decimal(str(row[12]))) if row[12] is not None else None,
                unrealized_gain_loss_percent=percent(row[13]) if row[13] is not None else None,
                portfolio_weight_percent=percent(Decimal(str(row[10])) / total_value * Decimal("100")) or Decimal("0"),
                valuation_price_source=row[14],
            )
            for row in self.db.execute(statement).all()
        ]

    def _ensure_portfolio(self, portfolio_id: int) -> None:
        exists = self.db.scalar(select(Portfolio.id).where(Portfolio.id == portfolio_id))
        if not exists:
            raise AppError("Portfolio not found", status_code=404, code="not_found")
