from decimal import Decimal

from app.utils.finance import dv01, market_value, valuation_price
from app.utils.isin import is_valid_indian_isin, normalize_isin


def test_indian_isin_validation() -> None:
    assert normalize_isin(" ine001a08024 ") == "INE001A08024"
    assert is_valid_indian_isin("INE001A08024")
    assert not is_valid_indian_isin("US001A08024")


def test_valuation_price_priority() -> None:
    assert valuation_price(Decimal("101"), Decimal("99"), Decimal("98"), Decimal("100")) == (
        Decimal("99"),
        "manual current price per unit",
    )
    assert valuation_price(None, Decimal("99"), Decimal("98"), Decimal("100")) == (
        Decimal("99"),
        "manual current price per unit",
    )
    assert valuation_price(None, None, Decimal("98"), Decimal("100")) == (
        Decimal("98"),
        "purchase price per unit",
    )


def test_market_value_and_dv01() -> None:
    value = market_value(Decimal("250"), Decimal("1012.50"))
    assert value == Decimal("253125.00")
    assert dv01(value, Decimal("4.2")) == Decimal("106.31")
