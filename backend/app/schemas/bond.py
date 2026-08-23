from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.isin import is_valid_indian_isin, normalize_isin


class BondBase(BaseModel):
    isin: str
    issuer: str = Field(min_length=2, max_length=200)
    security_name: str = Field(min_length=2)
    coupon_rate: Decimal = Field(ge=0, le=30)
    maturity_date: date
    face_value: Decimal = Field(gt=0)
    currency: str = "INR"
    credit_rating: str | None = None
    sector: str | None = None
    bond_type: str | None = None
    duration: Decimal | None = Field(default=None, ge=0, le=40)
    latest_price: Decimal | None = Field(default=None, ge=0)
    latest_yield: Decimal | None = Field(default=None, ge=0, le=40)
    price_source: str | None = None
    market_data_updated_at: datetime | None = None
    provider_name: str | None = None
    provider_identifier: str | None = None
    raw_provider_data: dict[str, Any] | None = None

    @field_validator("isin")
    @classmethod
    def validate_isin(cls, value: str) -> str:
        normalized = normalize_isin(value)
        if not is_valid_indian_isin(normalized):
            raise ValueError("ISIN must be a valid Indian bond ISIN starting with INE")
        return normalized

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, value: str) -> str:
        if value.upper() != "INR":
            raise ValueError("YieldLens MVP supports INR Indian bonds only")
        return "INR"


class BondReferenceData(BondBase):
    pass


class BondSearchResult(BondBase):
    pass


class BondRead(BondBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ManualBondCreate(BondBase):
    pass

