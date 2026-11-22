"""Struktura compose.yaml i Dockerfile (ZUS-02) – bez uruchamiania Dockera."""

from pathlib import Path
from typing import Any

import yaml  # type: ignore[import-untyped]

ROOT = Path(__file__).resolve().parents[3]


def compose() -> dict[str, Any]:
    data: dict[str, Any] = yaml.safe_load((ROOT / "compose.yaml").read_text(encoding="utf-8"))
    return data


def test_every_service_has_healthcheck() -> None:
    for name, service in compose()["services"].items():
        assert "healthcheck" in service, name


def test_db_is_pinned_pgvector_with_init_script() -> None:
    db = compose()["services"]["db"]
    assert db["image"].startswith("pgvector/pgvector:")
    assert db["image"].split(":")[1] not in {"latest", "pg17"}, "przypięta wersja pgvector"
    assert (ROOT / "docker" / "postgres" / "init" / "01-extensions.sql").is_file()


def test_api_waits_for_healthy_db_and_reads_env_file() -> None:
    api = compose()["services"]["api"]
    assert api["depends_on"]["db"]["condition"] == "service_healthy"
    assert api["depends_on"]["migrate"]["condition"] == "service_completed_successfully"
    assert api["env_file"] == [{"path": ".env", "required": False}]
    assert "@db:5432/" in api["environment"]["DATABASE_URL"]


def test_no_literal_secrets_in_compose() -> None:
    db = compose()["services"]["db"]
    assert db["environment"]["POSTGRES_PASSWORD"].startswith("${")


def test_dockerfile_ships_personas_and_healthcheck() -> None:
    dockerfile = (ROOT / "Dockerfile").read_text(encoding="utf-8")
    assert "FROM python:${PYTHON_VERSION}-slim" in dockerfile
    assert "COPY data/personas" in dockerfile
    assert "COPY data/knowledge" in dockerfile
    assert "HEALTHCHECK" in dockerfile
    assert "USER app" in dockerfile
    dockerignore = (ROOT / ".dockerignore").read_text(encoding="utf-8").splitlines()
    assert {".env", "data/*", "!data/personas", "!data/knowledge"} <= set(dockerignore)


def test_migrate_service_runs_alembic_once() -> None:
    migrate = compose()["services"]["migrate"]
    assert migrate["command"] == ["python", "-m", "api.db.migrate", "upgrade", "head"]
    assert migrate["restart"] == "no"
    assert migrate["build"] == compose()["services"]["api"]["build"]
