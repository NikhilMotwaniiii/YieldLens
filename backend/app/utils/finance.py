from decimal import ROUND_HALF_UP, Decimal


def money(value: Decimal | int | float | None) -> Decimal:
    if value is None:
        return Decimal("0")
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def percent(value: Decimal | int | float | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def valuation_price(
    provider_price: Decimal | None,
    manual_price: Decimal | None,
    purchase_price: Decimal | None,
    face_value: Decimal,
) -> tuple[Decimal, str]:
    if manual_price is not None:
        return manual_price, "manual current price per unit"
    if provider_price is not None:
        return provider_price, "provider market price per unit"
    if purchase_price is not None:
        return purchase_price, "purchase price per unit"
    return face_value, "face value fallback"


def market_value(quantity: Decimal, price: Decimal) -> Decimal:
    return money(quantity * price)


def dv01(value: Decimal, duration: Decimal) -> Decimal:
    # Approximate DV01 = market value * modified duration * 1 bp.
    return money(value * duration * Decimal("0.0001"))
