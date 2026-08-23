from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.providers.base import BondDataProvider
from app.providers.demo_provider import DemoBondDataProvider
from app.providers.hybrid_provider import HybridBondDataProvider
from app.providers.indian_bond_provider import IndianBondDataProvider
from app.services.analytics_service import AnalyticsService
from app.services.bond_search_service import BondSearchService
from app.services.import_service import ImportService
from app.services.portfolio_service import PortfolioService
from app.services.scenario_service import ScenarioService

_provider_instance: BondDataProvider | None = None


def get_provider(settings: Settings = Depends(get_settings)) -> BondDataProvider:
    global _provider_instance
    if _provider_instance is None:
        demo_provider = DemoBondDataProvider()
        live_provider = IndianBondDataProvider(settings)
        if settings.bond_provider == "indian":
            _provider_instance = live_provider
        elif settings.bond_provider == "hybrid":
            _provider_instance = HybridBondDataProvider(live_provider, demo_provider)
        else:
            _provider_instance = demo_provider
    return _provider_instance


def get_bond_service(
    db: Session = Depends(get_db),
    provider: BondDataProvider = Depends(get_provider),
    settings: Settings = Depends(get_settings),
) -> Generator[BondSearchService, None, None]:
    yield BondSearchService(db, provider, settings.search_cache_ttl_seconds)


def get_portfolio_service(
    db: Session = Depends(get_db),
    bond_service: BondSearchService = Depends(get_bond_service),
) -> Generator[PortfolioService, None, None]:
    yield PortfolioService(db, bond_service)


def get_analytics_service(db: Session = Depends(get_db)) -> Generator[AnalyticsService, None, None]:
    yield AnalyticsService(db)


def get_scenario_service(db: Session = Depends(get_db)) -> Generator[ScenarioService, None, None]:
    yield ScenarioService(db)


def get_import_service(
    db: Session = Depends(get_db),
    bond_service: BondSearchService = Depends(get_bond_service),
) -> Generator[ImportService, None, None]:
    yield ImportService(db, bond_service)
