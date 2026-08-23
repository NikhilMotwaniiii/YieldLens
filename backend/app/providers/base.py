from typing import Protocol

from app.schemas.bond import BondReferenceData, BondSearchResult


class BondDataProvider(Protocol):
    name: str

    async def search_bonds(self, query: str) -> list[BondSearchResult]:
        ...

    async def suggest_bonds(self) -> list[BondSearchResult]:
        ...

    async def get_bond(self, identifier: str) -> BondReferenceData | None:
        ...


class ProviderError(Exception):
    pass


class ProviderUnavailable(ProviderError):
    pass
