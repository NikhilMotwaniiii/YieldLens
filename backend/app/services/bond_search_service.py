import time
from collections.abc import Sequence

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import Bond
from app.providers.base import BondDataProvider
from app.schemas.bond import BondReferenceData, BondSearchResult
from app.utils.isin import normalize_isin


class BondSearchService:
    def __init__(self, db: Session, provider: BondDataProvider, cache_ttl_seconds: int) -> None:
        self.db = db
        self.provider = provider
        self.cache_ttl_seconds = cache_ttl_seconds
        self._cache: dict[str, tuple[float, list[BondSearchResult]]] = {}

    async def search(self, query: str) -> list[BondSearchResult]:
        normalized = query.strip()
        if len(normalized) < 2:
            return []
        key = normalized.lower()
        cached = self._cache.get(key)
        if cached and time.time() - cached[0] < self.cache_ttl_seconds:
            return cached[1]

        local = self._search_local(normalized)
        provider_results = await self.provider.search_bonds(normalized)
        merged = self._dedupe([*local, *provider_results])
        self._cache[key] = (time.time(), merged)
        return merged

    async def suggestions(self) -> list[BondSearchResult]:
        key = "__suggestions__"
        cached = self._cache.get(key)
        if cached and time.time() - cached[0] < self.cache_ttl_seconds:
            return cached[1]

        local = self._suggest_local()
        provider_results = await self.provider.suggest_bonds()
        merged = self._dedupe([*local, *provider_results])
        self._cache[key] = (time.time(), merged)
        return merged

    async def get_bond(self, isin: str) -> BondReferenceData | None:
        normalized = normalize_isin(isin)
        local = self.db.scalar(select(Bond).where(Bond.isin == normalized))
        if local:
            return BondReferenceData.model_validate(local, from_attributes=True)
        provider_bond = await self.provider.get_bond(normalized)
        if provider_bond:
            return provider_bond
        return None

    def upsert_bond(self, data: BondReferenceData) -> Bond:
        existing = self.db.scalar(select(Bond).where(Bond.isin == data.isin))
        values = data.model_dump()
        if existing:
            for field, value in values.items():
                setattr(existing, field, value)
            self.db.add(existing)
            self.db.flush()
            return existing
        bond = Bond(**values)
        self.db.add(bond)
        self.db.flush()
        return bond

    def _search_local(self, query: str) -> list[BondSearchResult]:
        pattern = f"%{query.lower()}%"
        statement = (
            select(Bond)
            .where(
                or_(
                    Bond.isin.ilike(pattern),
                    Bond.issuer.ilike(pattern),
                    Bond.security_name.ilike(pattern),
                )
            )
            .order_by(Bond.issuer.asc(), Bond.maturity_date.asc())
            .limit(12)
        )
        return [
            BondSearchResult.model_validate(bond, from_attributes=True)
            for bond in self.db.scalars(statement).all()
        ]

    def _suggest_local(self) -> list[BondSearchResult]:
        statement = (
            select(Bond)
            .order_by(
                Bond.latest_price.is_(None).asc(),
                Bond.credit_rating.asc().nulls_last(),
                Bond.issuer.asc(),
                Bond.maturity_date.asc(),
            )
            .limit(12)
        )
        return [
            BondSearchResult.model_validate(bond, from_attributes=True)
            for bond in self.db.scalars(statement).all()
        ]

    @staticmethod
    def _dedupe(results: Sequence[BondSearchResult]) -> list[BondSearchResult]:
        seen: set[str] = set()
        deduped: list[BondSearchResult] = []
        for result in results:
            if result.isin in seen:
                continue
            seen.add(result.isin)
            deduped.append(result)
        return deduped[:12]
