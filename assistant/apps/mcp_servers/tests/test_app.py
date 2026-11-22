"""Aplikacja HTTP z serwerami MCP i zapis audytu do Postgresa (integration)."""

import uuid
from collections.abc import Iterator
from datetime import UTC, datetime

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from starlette.testclient import TestClient

from mcp_servers import __version__
from mcp_servers.common.audit import AuditEntry, SqlAuditSink, _session_uuid
from mcp_servers.common.runtime import ServerDeps, utc_now
from mcp_servers.main import BUILDERS, Settings, create_app


@pytest.fixture
def client(deps: ServerDeps) -> Iterator[TestClient]:
    with TestClient(create_app(deps, ["testserver"])) as test_client:
        yield test_client


def test_health_lists_servers(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": __version__, "servers": sorted(BUILDERS)}


@pytest.mark.parametrize("name", sorted(BUILDERS))
def test_each_server_is_mounted(client: TestClient, name: str) -> None:
    # Żądanie bez protokołu MCP – ważne, że ścieżka istnieje (nie 404).
    response = client.post(f"/{name}/mcp", json={})
    assert response.status_code != 404


def test_startup_runs_before_serving(deps: ServerDeps) -> None:
    calls: list[str] = []

    async def startup() -> None:
        calls.append("wczytano korpus")

    with TestClient(create_app(deps, ["testserver"], startup=startup)) as test_client:
        assert calls == ["wczytano korpus"]
        assert test_client.get("/health").status_code == 200


def test_foreign_host_is_rejected(deps: ServerDeps) -> None:
    with TestClient(create_app(deps, ["mcp_servers:*"])) as test_client:
        response = test_client.post("/zus-ezla/mcp", json={})
    assert response.status_code in {400, 421}


def test_settings_require_strong_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("MCP_TOKEN_SECRET", "krotki")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://u:p@db/x")
    with pytest.raises(ValueError, match="mcp_token_secret"):
        Settings()


def test_default_clock_is_utc() -> None:
    assert utc_now().tzinfo is UTC


@pytest.mark.parametrize(
    ("value", "expected"),
    [(None, None), ("nie-uuid", None), (str(uuid.UUID(int=1)), uuid.UUID(int=1))],
)
def test_session_id_conversion(value: str | None, expected: uuid.UUID | None) -> None:
    assert _session_uuid(value) == expected


@pytest.mark.integration
async def test_sql_audit_sink_writes_audit_log(pg_url: str) -> None:
    from api.db import migrate

    migrate.upgrade(pg_url)
    engine = create_async_engine(pg_url)
    sink = SqlAuditSink(engine)
    await sink.record(
        AuditEntry(
            occurred_at=datetime(2026, 11, 22, 9, tzinfo=UTC),
            tool="zus-ezla.list_sick_leaves",
            outcome="ERROR",
            actor_ref="persona-t01",
            details={"code": "FORBIDDEN"},
        )
    )
    async with engine.connect() as connection:
        row = (
            await connection.execute(text("SELECT action, tool, outcome, details FROM audit_log"))
        ).one()
    await engine.dispose()
    assert tuple(row) == ("MCP_CALL", "zus-ezla.list_sick_leaves", "ERROR", {"code": "FORBIDDEN"})
