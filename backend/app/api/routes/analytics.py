from fastapi import APIRouter, Depends

from app.api.dependencies import get_analytics_service
from app.schemas.analytics import PortfolioAnalytics
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/portfolios/{portfolio_id}/analytics", tags=["analytics"])


@router.get("", response_model=PortfolioAnalytics)
def get_analytics(
    portfolio_id: int,
    service: AnalyticsService = Depends(get_analytics_service),
) -> PortfolioAnalytics:
    return service.get_portfolio_analytics(portfolio_id)

