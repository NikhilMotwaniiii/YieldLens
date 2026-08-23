from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import JSON, Date, DateTime, Index, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Bond(Base, TimestampMixin):
    __tablename__ = "bonds"

    id: Mapped[int] = mapped_column(primary_key=True)
    isin: Mapped[str] = mapped_column(String(12), unique=True, index=True, nullable=False)
    issuer: Mapped[str] = mapped_column(String(200), nullable=False)
    security_name: Mapped[str] = mapped_column(Text, nullable=False)
    coupon_rate: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)
    maturity_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    face_value: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=1000)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    credit_rating: Mapped[str | None] = mapped_column(String(32))
    sector: Mapped[str | None] = mapped_column(String(120))
    bond_type: Mapped[str | None] = mapped_column(String(80))
    duration: Mapped[Decimal | None] = mapped_column(Numeric(8, 4))
    latest_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 4))
    latest_yield: Mapped[Decimal | None] = mapped_column(Numeric(8, 4))
    price_source: Mapped[str | None] = mapped_column(String(80))
    market_data_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    provider_name: Mapped[str | None] = mapped_column(String(120))
    provider_identifier: Mapped[str | None] = mapped_column(String(120))
    raw_provider_data: Mapped[dict[str, Any] | None] = mapped_column(JSON)

    positions = relationship("PortfolioPosition", back_populates="bond")


Index("ix_bonds_issuer", Bond.issuer)
Index("ix_bonds_credit_rating", Bond.credit_rating)

