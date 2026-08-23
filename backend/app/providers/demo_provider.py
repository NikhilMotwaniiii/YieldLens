from app.data.demo_bonds import DEMO_BONDS
from app.schemas.bond import BondReferenceData, BondSearchResult
from app.utils.isin import normalize_isin


class DemoBondDataProvider:
    name = "DemoBondDataProvider"

    async def search_bonds(self, query: str) -> list[BondSearchResult]:
        normalized = query.strip().lower()
        if len(normalized) < 2:
            return []
        matches = [
            BondSearchResult(**bond.model_dump())
            for bond in DEMO_BONDS
            if normalized in bond.isin.lower()
            or normalized in bond.issuer.lower()
            or normalized in bond.security_name.lower()
        ]
        return matches[:12]

    async def suggest_bonds(self) -> list[BondSearchResult]:
        suggested_isins = {
            "INE001A08024",
            "INE090A08AA8",
            "INE020B08815",
            "INE134E08KA2",
            "INE261F08AA1",
            "INE053F07AB5",
            "INE115A07AA4",
            "INE296A07AA0",
            "INE522F07AA8",
            "INE752E07AA2",
        }
        return [
            BondSearchResult(**bond.model_dump())
            for bond in DEMO_BONDS
            if bond.isin in suggested_isins
        ]

    async def get_bond(self, identifier: str) -> BondReferenceData | None:
        isin = normalize_isin(identifier)
        for bond in DEMO_BONDS:
            if bond.isin == isin:
                return BondReferenceData(**bond.model_dump())
        return None
