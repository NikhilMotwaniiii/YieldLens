from functools import lru_cache

from pydantic import Field
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "YieldLens"
    environment: str = "development"
    database_url: str = "postgresql+psycopg://yieldlens:yieldlens@localhost:5432/yieldlens"
    backend_cors_origins: str = "http://localhost:3000"
    bond_provider: str = Field(default="demo", pattern="^(demo|indian|hybrid)$")
    provider_timeout_seconds: float = 4.0
    search_cache_ttl_seconds: int = 300
    live_bond_search_url: str | None = None
    live_bond_detail_url: str | None = None
    live_bond_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
