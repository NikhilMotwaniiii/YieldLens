from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, bonds, imports, portfolios, scenarios
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging

configure_logging()
settings = get_settings()

app = FastAPI(
    title="YieldLens API",
    description="Indian bond portfolio analytics API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
register_exception_handlers(app)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(bonds.router, prefix="/api/v1")
app.include_router(portfolios.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(scenarios.router, prefix="/api/v1")
app.include_router(imports.router, prefix="/api/v1")

