"""initial schema

Revision ID: 202608220001
Revises:
Create Date: 2026-08-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202608220001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "bonds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("isin", sa.String(length=12), nullable=False),
        sa.Column("issuer", sa.String(length=200), nullable=False),
        sa.Column("security_name", sa.Text(), nullable=False),
        sa.Column("coupon_rate", sa.Numeric(8, 4), nullable=False),
        sa.Column("maturity_date", sa.Date(), nullable=False),
        sa.Column("face_value", sa.Numeric(14, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("credit_rating", sa.String(length=32), nullable=True),
        sa.Column("sector", sa.String(length=120), nullable=True),
        sa.Column("bond_type", sa.String(length=80), nullable=True),
        sa.Column("duration", sa.Numeric(8, 4), nullable=True),
        sa.Column("latest_price", sa.Numeric(14, 4), nullable=True),
        sa.Column("latest_yield", sa.Numeric(8, 4), nullable=True),
        sa.Column("price_source", sa.String(length=80), nullable=True),
        sa.Column("market_data_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("provider_name", sa.String(length=120), nullable=True),
        sa.Column("provider_identifier", sa.String(length=120), nullable=True),
        sa.Column("raw_provider_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("isin"),
    )
    op.create_index("ix_bonds_credit_rating", "bonds", ["credit_rating"], unique=False)
    op.create_index("ix_bonds_isin", "bonds", ["isin"], unique=False)
    op.create_index("ix_bonds_issuer", "bonds", ["issuer"], unique=False)
    op.create_index("ix_bonds_maturity_date", "bonds", ["maturity_date"], unique=False)

    op.create_table(
        "portfolios",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "portfolio_positions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("portfolio_id", sa.Integer(), nullable=False),
        sa.Column("bond_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Numeric(18, 4), nullable=False),
        sa.Column("purchase_price", sa.Numeric(14, 4), nullable=True),
        sa.Column("purchase_date", sa.Date(), nullable=True),
        sa.Column("manual_current_price", sa.Numeric(14, 4), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["bond_id"], ["bonds.id"]),
        sa.ForeignKeyConstraint(["portfolio_id"], ["portfolios.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("portfolio_id", "bond_id", name="uq_portfolio_bond"),
    )
    op.create_index("ix_positions_bond_id", "portfolio_positions", ["bond_id"], unique=False)
    op.create_index("ix_positions_portfolio_id", "portfolio_positions", ["portfolio_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_positions_portfolio_id", table_name="portfolio_positions")
    op.drop_index("ix_positions_bond_id", table_name="portfolio_positions")
    op.drop_table("portfolio_positions")
    op.drop_table("portfolios")
    op.drop_index("ix_bonds_maturity_date", table_name="bonds")
    op.drop_index("ix_bonds_issuer", table_name="bonds")
    op.drop_index("ix_bonds_isin", table_name="bonds")
    op.drop_index("ix_bonds_credit_rating", table_name="bonds")
    op.drop_table("bonds")
