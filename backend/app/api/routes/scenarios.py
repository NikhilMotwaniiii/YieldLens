from fastapi import APIRouter, Depends

from app.api.dependencies import get_scenario_service
from app.schemas.analytics import InterestRateScenarioRequest, InterestRateScenarioResponse
from app.services.scenario_service import ScenarioService

router = APIRouter(prefix="/portfolios/{portfolio_id}/scenarios", tags=["scenarios"])


@router.post("/interest-rate", response_model=InterestRateScenarioResponse)
def run_interest_rate_scenario(
    portfolio_id: int,
    payload: InterestRateScenarioRequest,
    service: ScenarioService = Depends(get_scenario_service),
) -> InterestRateScenarioResponse:
    return service.run_interest_rate_scenario(portfolio_id, payload.shock_bps)

