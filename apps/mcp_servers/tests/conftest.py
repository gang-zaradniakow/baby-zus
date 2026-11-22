"""Fixture serwerów MCP: persony przez MockProfileSource, audyt w pamięci, stały zegar.

Klient MCP działa w pamięci (``mcp.Client(server)``) – pełny protokół bez sieci.
"""

from collections.abc import Awaitable, Callable, Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, cast

import pytest
from mcp import Client
from mcp.server.mcpserver import MCPServer
from mcp_types import CallToolResult

from assistant.llm import FakeEmbeddingClient
from assistant.rag import InMemoryKnowledgeIndex, KnowledgeBase, load_support_orgs
from mcp_servers.common.audit import InMemoryAuditSink
from mcp_servers.common.auth import TOKEN_META_KEY, Principal, TokenSigner
from mcp_servers.common.runtime import ServerDeps
from profile_source import MockProfileSource

ROOT = Path(__file__).resolve().parents[3]
PERSONAS_DIR = ROOT / "data" / "personas"
KNOWLEDGE_DIR = ROOT / "data" / "knowledge"
NOW = datetime(2026, 11, 22, 9, 0, tzinfo=UTC)
SECRET = "test-secret-0123456789"
PG_IMAGE = "pgvector/pgvector:0.8.0-pg17"

Call = Callable[..., Awaitable[CallToolResult]]


@pytest.fixture
def signer() -> TokenSigner:
    return TokenSigner(SECRET)


@pytest.fixture
def audit() -> InMemoryAuditSink:
    return InMemoryAuditSink()


@pytest.fixture
async def knowledge() -> KnowledgeBase:
    base = KnowledgeBase(FakeEmbeddingClient(), InMemoryKnowledgeIndex(), "fake")
    await base.ingest_directory(KNOWLEDGE_DIR)
    return base


@pytest.fixture
def deps(signer: TokenSigner, audit: InMemoryAuditSink, knowledge: KnowledgeBase) -> ServerDeps:
    return ServerDeps(
        MockProfileSource.from_personas(PERSONAS_DIR),
        signer,
        audit,
        lambda: NOW,
        knowledge=knowledge,
        support_orgs=load_support_orgs(KNOWLEDGE_DIR),
    )


@pytest.fixture
def token(signer: TokenSigner) -> Callable[..., str]:
    def _token(user_ref: str = "persona-t01", *, minutes: int = 5, sid: str | None = None) -> str:
        return signer.issue(Principal(user_ref, sid), NOW + timedelta(minutes=minutes))

    return _token


@pytest.fixture
def call(token: Callable[..., str]) -> Call:
    """``await call(server, "narzędzie", {...}, user="persona-t01")`` – z tokenem użytkownika."""

    async def _call(
        server: MCPServer,
        tool: str,
        arguments: dict[str, Any],
        *,
        user: str | None = "persona-t01",
        raw_token: str | None = None,
    ) -> CallToolResult:
        meta: dict[str, Any] = {}
        if raw_token is not None:
            meta[TOKEN_META_KEY] = raw_token
        elif user is not None:
            meta[TOKEN_META_KEY] = token(user)
        async with Client(server) as client:
            return await client.call_tool(tool, arguments, meta=cast("Any", meta))

    return _call


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
