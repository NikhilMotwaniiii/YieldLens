import logging
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any
from urllib.parse import urlencode

import httpx
from pydantic import ValidationError

from app.core.config import Settings
from app.providers.base import ProviderUnavailable
from app.schemas.bond import BondReferenceData, BondSearchResult
from app.utils.isin import is_valid_indian_isin, normalize_isin

logger = logging.getLogger(__name__)


class IndianBondDataProvider:
    """Adapter for legitimate Indian bond data APIs.

    Configure LIVE_BOND_SEARCH_URL and LIVE_BOND_DETAIL_URL for an authenticated vendor, exchange
    subscription, or explicitly permitted public endpoint. The adapter accepts common field names
    used by exchange/vendor JSON payloads and normalizes them to YieldLens' public schema.
    """

    name = "ConfiguredLiveIndianBondProvider"

    def __init__(self, settings: Settings) -> None:
        self._timeout = settings.provider_timeout_seconds
        self._search_url = settings.live_bond_search_url
        self._detail_url = settings.live_bond_detail_url
        self._api_key = settings.live_bond_api_key

    async def search_bonds(self, query: str) -> list[BondSearchResult]:
        if not self._search_url:
            logger.info("live_provider_not_configured", extra={"provider": self.name, "query": query})
            return []
        payload = await self._get_json(self._url(self._search_url, {"query": query, "q": query}))
        records = self._records(payload)
        results: list[BondSearchResult] = []
        for record in records:
            normalized = self._normalize_record(record)
            if normalized and self._matches(normalized, query):
                results.append(BondSearchResult(**normalized.model_dump()))
        return results[:20]

    async def suggest_bonds(self) -> list[BondSearchResult]:
        return []

    async def get_bond(self, identifier: str) -> BondReferenceData | None:
        if not self._detail_url:
            return None
        isin = normalize_isin(identifier)
        payload = await self._get_json(self._url(self._detail_url, {"isin": isin, "identifier": isin}))
        records = self._records(payload)
        for record in records:
            normalized = self._normalize_record(record)
            if normalized and normalized.isin == isin:
                return normalized
        return None

    async def _get_json(self, url: str) -> Any:
        headers = {
            "Accept": "application/json",
            "User-Agent": "YieldLens/0.1 educational analytics project",
        }
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"
        try:
            async with httpx.AsyncClient(timeout=self._timeout, follow_redirects=False) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                content_type = response.headers.get("content-type", "")
                if "json" not in content_type.lower():
                    raise ProviderUnavailable("Live provider did not return JSON")
                return response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise ProviderUnavailable("Indian bond provider is temporarily unavailable") from exc

    @staticmethod
    def _url(template: str, params: dict[str, str]) -> str:
        if "{query}" in template:
            return template.format(query=params["query"])
        if "{isin}" in template:
            return template.format(isin=params["isin"])
        separator = "&" if "?" in template else "?"
        key = "q" if "q" in params else "isin"
        return f"{template}{separator}{urlencode({key: params[key]})}"

    @staticmethod
    def _records(payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]
        if isinstance(payload, dict):
            for key in ("results", "data", "records", "items", "Table", "Table1"):
                value = payload.get(key)
                if isinstance(value, list):
                    return [item for item in value if isinstance(item, dict)]
            return [payload]
        return []

    def _normalize_record(self, record: dict[str, Any]) -> BondReferenceData | None:
        isin = normalize_isin(str(self._pick(record, "isin", "ISIN", "ISIN No", "ISIN_NO", "SM_ISIN_NO") or ""))
        if not is_valid_indian_isin(isin):
            return None
        issuer = self._pick(record, "issuer", "issuer_name", "Issuer Name", "ISSUER", "SLB Issuer Name")
        security_name = self._pick(
            record,
            "security_name",
            "security",
            "Security",
            "Security Name",
            "Scrip Name",
            "SCRIP_NAME",
            "scrip_cd",
        )
        coupon = self._decimal(self._pick(record, "coupon_rate", "coupon", "Coupon (%)", "COUPON", "Coupon"))
        maturity = self._date(self._pick(record, "maturity_date", "Maturity Date", "MATURITY_DATE", "Maturity"))
        if not issuer or not security_name or coupon is None or maturity is None:
            return None
        latest_price = self._decimal(
            self._pick(record, "latest_price", "ltp", "LTP", "LastTradeRate", "Weighted Average Price", "Price")
        )
        latest_yield = self._decimal(
            self._pick(record, "latest_yield", "yield", "Yield", "Weighted Average Yield", "YIELD")
        )
        try:
            return BondReferenceData(
                isin=isin,
                issuer=str(issuer).strip(),
                security_name=str(security_name).strip(),
                coupon_rate=coupon,
                maturity_date=maturity,
                face_value=self._decimal(self._pick(record, "face_value", "Face Value", "FACE_VALUE")) or Decimal("1000"),
                credit_rating=self._optional_str(self._pick(record, "credit_rating", "rating", "Rating", "RATING")),
                sector=self._optional_str(self._pick(record, "sector", "Sector")),
                bond_type=self._optional_str(self._pick(record, "bond_type", "Bond Type")) or "Corporate",
                duration=self._decimal(self._pick(record, "duration", "Duration")),
                latest_price=latest_price,
                latest_yield=latest_yield,
                price_source="live provider market price" if latest_price is not None else None,
                market_data_updated_at=datetime.now(UTC),
                provider_name=self.name,
                provider_identifier=isin,
                raw_provider_data=record,
            )
        except ValidationError:
            return None

    @staticmethod
    def _pick(record: dict[str, Any], *keys: str) -> Any:
        lowered = {str(key).lower().replace("_", " ").strip(): value for key, value in record.items()}
        for key in keys:
            if key in record:
                return record[key]
            normalized = key.lower().replace("_", " ").strip()
            if normalized in lowered:
                return lowered[normalized]
        return None

    @staticmethod
    def _optional_str(value: Any) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text if text and text != "--" else None

    @staticmethod
    def _decimal(value: Any) -> Decimal | None:
        if value is None:
            return None
        text = str(value).replace(",", "").strip()
        if not text or text in {"--", "-"}:
            return None
        try:
            return Decimal(text)
        except Exception:
            return None

    @staticmethod
    def _date(value: Any) -> date | None:
        if value is None:
            return None
        text = str(value).strip()
        if not text or text in {"--", "-"}:
            return None
        for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%d %b %Y", "%d-%b-%Y"):
            try:
                return datetime.strptime(text, fmt).date()
            except ValueError:
                continue
        return None

    @staticmethod
    def _matches(bond: BondReferenceData, query: str) -> bool:
        needle = query.strip().lower()
        return needle in bond.isin.lower() or needle in bond.issuer.lower() or needle in bond.security_name.lower()
