from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_bond_service
from app.core.exceptions import AppError
from app.schemas.bond import BondReferenceData, BondSearchResult
from app.services.bond_search_service import BondSearchService

router = APIRouter(prefix="/bonds", tags=["bonds"])


@router.get("/suggestions", response_model=list[BondSearchResult])
async def suggest_bonds(
    service: BondSearchService = Depends(get_bond_service),
) -> list[BondSearchResult]:
    return await service.suggestions()


@router.get("/search", response_model=list[BondSearchResult])
async def search_bonds(
    q: str = Query(min_length=2, max_length=80),
    service: BondSearchService = Depends(get_bond_service),
) -> list[BondSearchResult]:
    return await service.search(q)


@router.get("/{isin}", response_model=BondReferenceData)
async def get_bond(isin: str, service: BondSearchService = Depends(get_bond_service)) -> BondReferenceData:
    bond = await service.get_bond(isin)
    if not bond:
        raise AppError("Bond not found", status_code=404, code="bond_not_found")
    return bond
