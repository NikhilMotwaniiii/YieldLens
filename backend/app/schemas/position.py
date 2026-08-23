from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.bond import BondRead, ManualBondCreate


class PositionCreate(BaseModel):
    isin: str | None = None
    bond: ManualBondCreate | None = None
    quantity: Decimal = Field(gt=0)
    purchase_price: Decimal | None = Field(default=None, ge=0)
    purchase_date: date | None = None
    manual_current_price: Decimal | None = Field(default=None, ge=0)


class PositionUpdate(BaseModel):
    quantity: Decimal | None = Field(default=None, gt=0)
    purchase_price: Decimal | None = Field(default=None, ge=0)
    purchase_date: date | None = None
    manual_current_price: Decimal | None = Field(default=None, ge=0)


class PositionRead(BaseModel):
    id: int
    portfolio_id: int
    bond: BondRead
    quantity: Decimal
    purchase_price: Decimal | None
    purchase_date: date | None
    manual_current_price: Decimal | None
    valuation_price: Decimal
    valuation_price_source: str
    market_value: Decimal
    portfolio_weight_percent: Decimal | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

