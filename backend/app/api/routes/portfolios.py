from fastapi import APIRouter, Depends, Response, status

from app.api.dependencies import get_portfolio_service
from app.schemas.portfolio import PortfolioCreate, PortfolioDetail, PortfolioRead, PortfolioUpdate
from app.schemas.position import PositionCreate, PositionRead, PositionUpdate
from app.services.portfolio_service import PortfolioService

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.get("", response_model=list[PortfolioRead])
def list_portfolios(service: PortfolioService = Depends(get_portfolio_service)) -> list[PortfolioRead]:
    return service.list_portfolios()


@router.post("", response_model=PortfolioRead, status_code=status.HTTP_201_CREATED)
def create_portfolio(
    payload: PortfolioCreate,
    service: PortfolioService = Depends(get_portfolio_service),
) -> PortfolioRead:
    return service.create_portfolio(payload)


@router.post("/demo", response_model=PortfolioRead)
def ensure_demo_portfolio(service: PortfolioService = Depends(get_portfolio_service)) -> PortfolioRead:
    return service.ensure_demo_portfolio()


@router.get("/{portfolio_id}", response_model=PortfolioDetail)
def get_portfolio(
    portfolio_id: int,
    service: PortfolioService = Depends(get_portfolio_service),
) -> PortfolioDetail:
    return service.get_portfolio(portfolio_id)


@router.put("/{portfolio_id}", response_model=PortfolioRead)
def update_portfolio(
    portfolio_id: int,
    payload: PortfolioUpdate,
    service: PortfolioService = Depends(get_portfolio_service),
) -> PortfolioRead:
    return service.update_portfolio(portfolio_id, payload)


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio(
    portfolio_id: int,
    service: PortfolioService = Depends(get_portfolio_service),
) -> Response:
    service.delete_portfolio(portfolio_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{portfolio_id}/positions", response_model=PositionRead, status_code=status.HTTP_201_CREATED)
async def add_position(
    portfolio_id: int,
    payload: PositionCreate,
    service: PortfolioService = Depends(get_portfolio_service),
) -> PositionRead:
    return await service.add_position(portfolio_id, payload)


@router.put("/{portfolio_id}/positions/{position_id}", response_model=PositionRead)
def update_position(
    portfolio_id: int,
    position_id: int,
    payload: PositionUpdate,
    service: PortfolioService = Depends(get_portfolio_service),
) -> PositionRead:
    return service.update_position(portfolio_id, position_id, payload)


@router.delete("/{portfolio_id}/positions/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_position(
    portfolio_id: int,
    position_id: int,
    service: PortfolioService = Depends(get_portfolio_service),
) -> Response:
    service.delete_position(portfolio_id, position_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
