from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Index, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class PortfolioPosition(Base, TimestampMixin):
    __tablename__ = "portfolio_positions"
    __table_args__ = (
        UniqueConstraint("portfolio_id", "bond_id", name="uq_portfolio_bond"),
        Index("ix_positions_portfolio_id", "portfolio_id"),
        Index("ix_positions_bond_id", "bond_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    portfolio_id: Mapped[int] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    bond_id: Mapped[int] = mapped_column(ForeignKey("bonds.id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    purchase_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 4))
    purchase_date: Mapped[date | None] = mapped_column(Date)
    manual_current_price: Mapped[Decimal | None] = mapped_column(Numeric(14, 4))

    portfolio = relationship("Portfolio", back_populates="positions")
    bond = relationship("Bond", back_populates="positions")

