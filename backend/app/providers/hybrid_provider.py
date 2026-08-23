import logging

from app.providers.base import BondDataProvider, ProviderError
from app.schemas.bond import BondReferenceData, BondSearchResult

logger = logging.getLogger(__name__)


class HybridBondDataProvider:
    name = "HybridBondDataProvider"

    def __init__(self, live_provider: BondDataProvider, fallback_provider: BondDataProvider) -> None:
        self.live_provider = live_provider
        self.fallback_provider = fallback_provider

    async def search_bonds(self, query: str) -> list[BondSearchResult]:
        live_results: list[BondSearchResult] = []
        try:
            live_results = await self.live_provider.search_bonds(query)
        except ProviderError:
            logger.warning("live_bond_search_failed", extra={"query": query})
        fallback_results = await self.fallback_provider.search_bonds(query)
        return self._dedupe([*live_results, *fallback_results])

    async def suggest_bonds(self) -> list[BondSearchResult]:
        live_results: list[BondSearchResult] = []
        try:
            live_results = await self.live_provider.suggest_bonds()
        except ProviderError:
            logger.warning("live_bond_suggestions_failed")
        fallback_results = await self.fallback_provider.suggest_bonds()
        return self._dedupe([*live_results, *fallback_results])

    async def get_bond(self, identifier: str) -> BondReferenceData | None:
        try:
            live = await self.live_provider.get_bond(identifier)
            if live:
                return live
        except ProviderError:
            logger.warning("live_bond_detail_failed", extra={"identifier": identifier})
        return await self.fallback_provider.get_bond(identifier)

    @staticmethod
    def _dedupe(results: list[BondSearchResult]) -> list[BondSearchResult]:
        seen: set[str] = set()
        deduped: list[BondSearchResult] = []
        for result in results:
            if result.isin in seen:
                continue
            seen.add(result.isin)
            deduped.append(result)
        return deduped[:20]
