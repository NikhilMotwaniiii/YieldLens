from functools import lru_cache

from pydantic import Field
from pydantic import field_validator
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_DATABASE_URL = "postgresql+psycopg://yieldlens:yieldlens@localhost:5432/yieldlens"


class Settings(BaseSettings):
    app_name: str = "YieldLens"
    environment: str = "development"
    database_url: str = DEFAULT_DATABASE_URL
    postgres_uri: str | None = None
    backend_cors_origins: str = "http://localhost:3000"
    bond_provider: str = Field(default="demo", pattern="^(demo|indian|hybrid)$")
    provider_timeout_seconds: float = 4.0
    search_cache_ttl_seconds: int = 300
    live_bond_search_url: str | None = None
    live_bond_detail_url: str | None = None
    live_bond_api_key: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @staticmethod
    def _normalize_database_url(value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        return cls._normalize_database_url(value)

    @model_validator(mode="after")
    def use_northflank_postgres_uri(self) -> "Settings":
        if self.database_url == DEFAULT_DATABASE_URL and self.postgres_uri:
            self.database_url = self._normalize_database_url(self.postgres_uri)
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
