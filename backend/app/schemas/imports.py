from decimal import Decimal

from pydantic import BaseModel


class ImportErrorItem(BaseModel):
    row: int
    field: str
    message: str


class ImportResult(BaseModel):
    valid_rows: int
    invalid_rows: int
    imported_rows: int
    errors: list[ImportErrorItem]


class CsvTemplateRow(BaseModel):
    isin: str
    issuer: str
    security_name: str
    coupon_rate: Decimal
    maturity_date: str
    face_value: Decimal
    quantity: Decimal
    purchase_price: Decimal | None = None
    current_price: Decimal | None = None
    duration: Decimal | None = None
    rating: str | None = None
    sector: str | None = None

