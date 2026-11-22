"""``/health`` – TA-01 (baza działa → 200), TA-02 (baza nie odpowiada → 503)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncEngine

from api import __version__
from api.db import migrate
from api.db.engine import database_is_up
from api.main import create_app
from api.routers.health import database_probe
from api.settings import Settings

UNREACHABLE_DB = "postgresql+asyncpg://zus:zus@127.0.0.1:1/zus"


def test_ta01_health_ok_when_database_answers() -> None:
    app = create_app(Settings(database_url=UNREACHABLE_DB))

    async def database_ok() -> bool:
        return True

    app.dependency_overrides[database_probe] = database_ok
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": __version__, "database": "ok"}


def test_ta02_health_503_when_database_is_down() -> None:
    app = create_app(Settings(database_url=UNREACHABLE_DB, health_db_timeout_s=0.5))
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 503
    assert response.json() == {
        "code": "DATABASE_UNAVAILABLE",
        "message": "Baza danych jest niedostępna.",
        "details": [],
    }


class _Connection:
    async def __aenter__(self) -> _Connection:
        return self

    async def __aexit__(self, *_: object) -> None:
        return None

    async def execute(self, _: object) -> None:
        return None


class _Engine:
    def connect(self) -> _Connection:
        return _Connection()


async def test_database_is_up_when_select_succeeds() -> None:
    engine: AsyncEngine = _Engine()  # type: ignore[assignment]
    assert await database_is_up(engine, timeout_s=1)


@pytest.mark.integration
def test_ta01_health_with_real_postgres(pg_url: str) -> None:
    migrate.upgrade(pg_url)
    with TestClient(create_app(Settings(database_url=pg_url))) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["database"] == "ok"
