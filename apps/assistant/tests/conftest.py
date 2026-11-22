"""Fixture asystenta: Postgres z testcontainers (marker ``integration``, pomijany bez Dockera)."""

from collections.abc import Iterator

import pytest

PG_IMAGE = "pgvector/pgvector:0.8.0-pg17"


def docker_available() -> bool:
    from testcontainers.core.docker_client import DockerClient

    try:
        DockerClient().client.ping()
    except Exception:
        return False
    return True


@pytest.fixture(scope="session")
def pg_url() -> Iterator[str]:
    if not docker_available():
        pytest.skip("Docker niedostępny – test integracyjny pominięty")
    from testcontainers.community.postgres import PostgresContainer

    with PostgresContainer(PG_IMAGE, driver="asyncpg") as container:
        yield container.get_connection_url()
