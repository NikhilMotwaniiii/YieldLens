import re

INDIAN_ISIN_RE = re.compile(r"^INE[A-Z0-9]{9}$")


def is_valid_indian_isin(value: str) -> bool:
    return bool(INDIAN_ISIN_RE.fullmatch(value.strip().upper()))


def normalize_isin(value: str) -> str:
    return value.strip().upper()

