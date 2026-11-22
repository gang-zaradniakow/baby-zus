"""Migracje Alembic: SQL offline (bez bazy) i TA-03 up/down/up na Postgresie (integration)."""

import asyncio

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from sqlalchemy import inspect
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from api.db import migrate
from api.db.models import Base
from api.settings import get_settings

TABLES = {"sessions", "messages", "audit_log", "analytics_events", "escalations"}
OFFLINE_URL = "postgresql+asyncpg://u:p%40ss@localhost/x"


def test_offline_upgrade_sql_creates_all_tables(capsys: pytest.CaptureFixture[str]) -> None:
    migrate.upgrade(OFFLINE_URL, sql=True)
    sql = capsys.readouterr().out
    for table in TABLES:
        assert f"CREATE TABLE {table}" in sql
    assert "CREATE EXTENSION IF NOT EXISTS vector" in sql
    assert "ON DELETE CASCADE" in sql
    assert "ON DELETE SET NULL" in sql


def test_offline_downgrade_sql_drops_all_tables(capsys: pytest.CaptureFixture[str]) -> None:
    migrate.downgrade(OFFLINE_URL, "0001:base", sql=True)
    sql = capsys.readouterr().out
    for table in TABLES:
        assert f"DROP TABLE {table}" in sql


@pytest.mark.parametrize(
    ("argv", "expected"),
    [
        (["upgrade", "--sql", "--url", OFFLINE_URL], "CREATE TABLE sessions"),
        (["downgrade", "0001:base", "--sql", "--url", OFFLINE_URL], "DROP TABLE sessions"),
    ],
)
def test_cli(argv: list[str], expected: str, capsys: pytest.CaptureFixture[str]) -> None:
    assert migrate.main(argv) == 0
    assert expected in capsys.readouterr().out


def test_cli_uses_database_url_from_env(
    monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setenv("DATABASE_URL", OFFLINE_URL)
    get_settings.cache_clear()
    try:
        assert migrate.main(["upgrade", "head", "--sql"]) == 0
    finally:
        get_settings.cache_clear()
    assert "CREATE TABLE sessions" in capsys.readouterr().out


def _schema_state(url: str) -> tuple[set[str], list[object]]:
    def read(connection: Connection) -> tuple[set[str], list[object]]:
        tables = set(inspect(connection).get_table_names())
        diff = compare_metadata(MigrationContext.configure(connection), Base.metadata)
        return tables, diff

    async def run() -> tuple[set[str], list[object]]:
        engine = create_async_engine(url)
        async with engine.connect() as connection:
            result = await connection.run_sync(read)
        await engine.dispose()
        return result

    return asyncio.run(run())


@pytest.mark.integration
def test_ta03_upgrade_downgrade_upgrade(pg_url: str) -> None:
    migrate.upgrade(pg_url)
    tables, diff = _schema_state(pg_url)
    assert tables >= TABLES
    assert diff == [], "modele i migracje się rozjechały"

    migrate.downgrade(pg_url)
    tables, _ = _schema_state(pg_url)
    assert not tables & TABLES

    migrate.upgrade(pg_url)
    tables, _ = _schema_state(pg_url)
    assert tables >= TABLES
