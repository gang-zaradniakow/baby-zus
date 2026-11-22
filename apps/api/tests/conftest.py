"""Fixture API.

- ``client``: aplikacja z repozytorium sesji w pamięci, mockiem profilu (persony) i zegarem
  testowym – testy endpointów działają bez Dockera,
- ``pg_url``: Postgres z testcontainers (marker ``integration``, pomijany bez Dockera).
"""

from collections.abc import Callable, Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api.main import create_app
from api.services.sessions import InMemorySessionRepository
from api.settings import Settings
from api.testing import FakeClock
from profile_source import MockProfileSource

PG_IMAGE = "pgvector/pgvector:0.8.0-pg17"  # ta sama wersja co w compose.yaml
ROOT = Path(__file__).resolve().parents[3]
PERSONAS_DIR = ROOT / "data" / "personas"
UNREACHABLE_DB = "postgresql+asyncpg://zus:zus@127.0.0.1:1/zus"


@pytest.fixture
def clock() -> FakeClock:
    return FakeClock()


@pytest.fixture
def client(clock: FakeClock) -> Iterator[TestClient]:
    app = create_app(
        Settings(database_url=UNREACHABLE_DB, session_ttl_minutes=30),
        profile_source=MockProfileSource.from_personas(PERSONAS_DIR),
        sessions=InMemorySessionRepository(),
        clock=clock,
    )
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client


Login = Callable[..., dict[str, str]]


@pytest.fixture
def login(client: TestClient) -> Login:
    """Logowanie symulowane; zwraca nagłówek ``Authorization`` dla persony."""

    def _login(user_ref: str = "persona-t01") -> dict[str, str]:
        response = client.post("/auth/mobywatel", json={"userRef": user_ref})
        assert response.status_code == 201, response.text
        return {"Authorization": f"Bearer {response.json()['token']}"}

    return _login


def docker_available() -> bool:
    # Klient z testcontainers – import ``docker`` myli mypy z katalogiem docker/ w repo.
    from testcontainers.core.docker_client import DockerClient

    try:
        DockerClient().client.ping()
    except Exception:
        return False
    return True


@pytest.fixture(scope="session")
def pg_url() -> Iterator[str]:
    """Adres czystej bazy (asyncpg). Bez Dockera test jest pomijany, a nie oblany."""
    if not docker_available():
        pytest.skip("Docker niedostępny – test integracyjny pominięty")
    from testcontainers.community.postgres import PostgresContainer

    with PostgresContainer(PG_IMAGE, driver="asyncpg") as container:
        yield container.get_connection_url()
