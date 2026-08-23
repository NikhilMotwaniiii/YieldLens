from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class MetricWithCoverage(BaseModel):
    value: Decimal | None
    coverage_percent: Decimal


class ExposureItem(BaseModel):
    name: str
    market_value: Decimal
    percent: Decimal


class MaturityBucket(BaseModel):
    bucket: str
    market_value: Decimal
    percent: Decimal


class TopPosition(BaseModel):
    position_id: int
    bond_id: int
    isin: str
    issuer: str
    security_name: str
    coupon_rate: Decimal
    maturity_date: date
    credit_rating: str | None
    latest_yield: Decimal | None
    duration: Decimal | None
    market_value: Decimal
    cost_basis: Decimal | None
    unrealized_gain_loss: Decimal | None
    unrealized_gain_loss_percent: Decimal | None
    portfolio_weight_percent: Decimal
    valuation_price_source: str


class GainLossSummary(BaseModel):
    total_cost_basis: Decimal
    unrealized_gain_loss: Decimal
    unrealized_gain_loss_percent: Decimal | None
    coverage_percent: Decimal


class GainLossItem(BaseModel):
    position_id: int
    isin: str
    issuer: str
    security_name: str
    market_value: Decimal
    cost_basis: Decimal
    unrealized_gain_loss: Decimal
    unrealized_gain_loss_percent: Decimal


class PortfolioAnalytics(BaseModel):
    portfolio_id: int
    position_count: int
    portfolio_value: Decimal
    weighted_coupon: Decimal | None
    weighted_yield: MetricWithCoverage
    weighted_duration: MetricWithCoverage
    portfolio_dv01: Decimal
    gain_loss: GainLossSummary
    nearest_maturity: date | None
    furthest_maturity: date | None
    rating_exposure: list[ExposureItem]
    sector_exposure: list[ExposureItem]
    issuer_exposure: list[ExposureItem]
    maturity_distribution: list[MaturityBucket]
    gain_loss_contributors: list[GainLossItem]
    top_positions: list[TopPosition]


class InterestRateScenarioRequest(BaseModel):
    shock_bps: int


class ScenarioImpact(BaseModel):
    bond_id: int
    isin: str
    security_name: str
    current_value: Decimal
    estimated_change: Decimal
    estimated_change_percent: Decimal


class InterestRateScenarioResponse(BaseModel):
    scenario_bps: int
    current_portfolio_value: Decimal
    estimated_portfolio_value: Decimal
    estimated_change: Decimal
    estimated_change_percent: Decimal
    eligible_portfolio_value: Decimal
    coverage_percent: Decimal
    largest_impacts: list[ScenarioImpact]
