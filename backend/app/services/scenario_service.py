from decimal import Decimal

from sqlalchemy import func, literal, select
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models import Bond, Portfolio, PortfolioPosition
from app.schemas.analytics import (
    InterestRateScenarioResponse,
    ScenarioImpact,
)
from app.services.analytics_service import AnalyticsService
from app.utils.finance import money, percent


class ScenarioService:
    ALLOWED_SHOCKS = {-200, -100, -50, 50, 100, 200}

    def __init__(self, db: Session) -> None:
        self.db = db
        self.analytics = AnalyticsService(db)

    def run_interest_rate_scenario(self, portfolio_id: int, shock_bps: int) -> InterestRateScenarioResponse:
        if shock_bps not in self.ALLOWED_SHOCKS:
            raise AppError("Shock must be one of -200, -100, -50, 50, 100, 200 bps", status_code=422)
        if not self.db.scalar(select(Portfolio.id).where(Portfolio.id == portfolio_id)):
            raise AppError("Portfolio not found", status_code=404, code="not_found")

        current_value = self.analytics._portfolio_value(portfolio_id)
        shock_decimal = Decimal(shock_bps) / Decimal("10000")
        value_expr = AnalyticsService.market_value_expr()
        change_expr = value_expr * Bond.duration * -shock_decimal
        eligible_value = Decimal(
            str(
                self.db.scalar(
                    select(func.coalesce(func.sum(value_expr), literal(0)))
                    .select_from(PortfolioPosition)
                    .join(Bond, Bond.id == PortfolioPosition.bond_id)
                    .where(PortfolioPosition.portfolio_id == portfolio_id, Bond.duration.is_not(None))
                )
                or 0
            )
        )
        estimated_change = Decimal(
            str(
                self.db.scalar(
                    select(func.coalesce(func.sum(change_expr), literal(0)))
                    .select_from(PortfolioPosition)
                    .join(Bond, Bond.id == PortfolioPosition.bond_id)
                    .where(PortfolioPosition.portfolio_id == portfolio_id, Bond.duration.is_not(None))
                )
                or 0
            )
        )
        statement = (
            select(
                Bond.id,
                Bond.isin,
                Bond.security_name,
                value_expr.label("current_value"),
                change_expr.label("estimated_change"),
                (Bond.duration * -shock_decimal * Decimal("100")).label("estimated_change_percent"),
            )
            .select_from(PortfolioPosition)
            .join(Bond, Bond.id == PortfolioPosition.bond_id)
            .where(PortfolioPosition.portfolio_id == portfolio_id, Bond.duration.is_not(None))
            .order_by(func.abs(change_expr).desc())
            .limit(5)
        )
        coverage = Decimal("0") if current_value <= 0 else eligible_value / current_value * Decimal("100")
        change_percent = Decimal("0") if current_value <= 0 else estimated_change / current_value * Decimal("100")

        return InterestRateScenarioResponse(
            scenario_bps=shock_bps,
            current_portfolio_value=money(current_value),
            estimated_portfolio_value=money(current_value + estimated_change),
            estimated_change=money(estimated_change),
            estimated_change_percent=percent(change_percent) or Decimal("0"),
            eligible_portfolio_value=money(eligible_value),
            coverage_percent=percent(coverage) or Decimal("0"),
            largest_impacts=[
                ScenarioImpact(
                    bond_id=row[0],
                    isin=row[1],
                    security_name=row[2],
                    current_value=money(Decimal(str(row[3]))),
                    estimated_change=money(Decimal(str(row[4]))),
                    estimated_change_percent=percent(row[5]) or Decimal("0"),
                )
                for row in self.db.execute(statement).all()
            ],
        )

