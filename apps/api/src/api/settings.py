"""Konfiguracja API ze zmiennych środowiskowych (wzór: ``.env.example``)."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_DATABASE_URL = "postgresql+asyncpg://zus:zus@localhost:5432/zus"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore", frozen=True)

    database_url: str = LOCAL_DATABASE_URL
    """Adres bazy w formacie SQLAlchemy (sterownik asyncpg)."""
    health_db_timeout_s: float = Field(default=2.0, gt=0)
    """Ile ``/health`` czeka na odpowiedź bazy, zanim zgłosi 503."""
    session_ttl_minutes: int = Field(default=60, gt=0)
    """Ważność tokenu sesji (logowanie symulowane i tryb bez logowania)."""
    chat_timeout_s: float = Field(default=30.0, gt=0)
    """Limit czasu odpowiedzi asystenta na ``POST /chat`` (potem 504 + propozycja eskalacji)."""


@lru_cache
def get_settings() -> Settings:
    return Settings()
