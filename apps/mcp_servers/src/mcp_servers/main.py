"""Aplikacja ASGI z serwerami MCP (``uvicorn mcp_servers.main:app``).

Każdy serwer z §7 ma własny adres streamable HTTP: ``/<nazwa>/mcp`` (np. ``/zus-ezla/mcp``).
Kolejne serwery (kalkulator, dokumenty, wiedza…) dopisuje się do ``BUILDERS``.
"""

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import AsyncExitStack, asynccontextmanager
from pathlib import Path
from typing import Final, Literal

from mcp.server.mcpserver import MCPServer
from mcp.server.transport_security import TransportSecuritySettings
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.ext.asyncio import create_async_engine
from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route

from assistant.llm.factory import create_embedding_client
from assistant.rag import (
    InMemoryKnowledgeIndex,
    KnowledgeBase,
    KnowledgeIndex,
    PgVectorKnowledgeIndex,
    load_support_orgs,
)
from assistant.rag.ingest import embedding_model_name
from mcp_servers import __version__
from mcp_servers.common.audit import SqlAuditSink
from mcp_servers.common.auth import TokenSigner
from mcp_servers.common.runtime import ServerDeps
from mcp_servers.dokumenty import server as dokumenty
from mcp_servers.kalkulator import server as kalkulator
from mcp_servers.profil import server as profil
from mcp_servers.usc import server as usc
from mcp_servers.wiedza import server as wiedza
from mcp_servers.zus_ezla import server as zus_ezla
from mcp_servers.zus_naleznosci import server as zus_naleznosci
from mcp_servers.zus_pue import server as zus_pue
from mcp_servers.zus_ubezpieczenia import server as zus_ubezpieczenia
from profile_source import create_profile_source

MCP_PATH: Final = "/mcp"

BUILDERS: Final[dict[str, Callable[[ServerDeps], MCPServer]]] = {
    zus_ubezpieczenia.NAME: zus_ubezpieczenia.build,
    zus_ezla.NAME: zus_ezla.build,
    zus_naleznosci.NAME: zus_naleznosci.build,
    profil.NAME: profil.build,
    kalkulator.NAME: kalkulator.build,
    wiedza.NAME: wiedza.build,
    zus_pue.NAME: zus_pue.build,
    dokumenty.NAME: dokumenty.build,
    usc.NAME: usc.build,
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore", frozen=True)

    mcp_token_secret: str = Field(min_length=16)
    """Wspólny sekret z API do weryfikacji tokenów dostępu (``MCP_TOKEN_SECRET``)."""
    database_url: str
    """Baza z tabelą ``audit_log`` (migracje API)."""
    mcp_allowed_hosts: list[str] = ["localhost:*", "127.0.0.1:*", "mcp_servers:*"]
    """Dozwolone nagłówki Host (ochrona przed DNS rebinding)."""
    knowledge_dir: Path = Path("data/knowledge")
    knowledge_index: Literal["memory", "pgvector"] = "memory"
    """``memory`` – korpus wczytywany przy starcie; ``pgvector`` – po ``assistant.rag.ingest``."""


def build_servers(deps: ServerDeps) -> dict[str, MCPServer]:
    return {name: build(deps) for name, build in BUILDERS.items()}


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "version": __version__, "servers": sorted(BUILDERS)})


Startup = Callable[[], Awaitable[object]]


def create_app(
    deps: ServerDeps, allowed_hosts: list[str], *, startup: Startup | None = None
) -> Starlette:
    servers = build_servers(deps)
    security = TransportSecuritySettings(allowed_hosts=allowed_hosts, allowed_origins=[])
    routes: list[Route | Mount] = [Route("/health", health)]
    for name, server in servers.items():
        http_app = server.streamable_http_app(
            streamable_http_path=MCP_PATH,
            stateless_http=True,
            json_response=True,
            transport_security=security,
        )
        routes.append(Mount(f"/{name}", app=http_app))

    @asynccontextmanager
    async def lifespan(_: Starlette) -> AsyncIterator[None]:
        # Zamontowane aplikacje nie dostają własnego lifespan – menedżery sesji startujemy tu.
        if startup is not None:
            await startup()
        async with AsyncExitStack() as stack:
            for server in servers.values():
                await stack.enter_async_context(server.session_manager.run())
            yield

    return Starlette(routes=routes, lifespan=lifespan)


def create_production_app() -> Starlette:  # pragma: no cover – konfiguracja ze środowiska
    settings = Settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    index: KnowledgeIndex = (
        PgVectorKnowledgeIndex(engine)
        if settings.knowledge_index == "pgvector"
        else InMemoryKnowledgeIndex()
    )
    knowledge = KnowledgeBase(create_embedding_client(), index, embedding_model_name())
    deps = ServerDeps(
        profile_source=create_profile_source(),
        signer=TokenSigner(settings.mcp_token_secret),
        audit=SqlAuditSink(engine),
        knowledge=knowledge,
        support_orgs=load_support_orgs(settings.knowledge_dir),
    )

    async def load_knowledge() -> int:
        return await knowledge.ingest_directory(settings.knowledge_dir)

    startup = load_knowledge if settings.knowledge_index == "memory" else None
    return create_app(deps, settings.mcp_allowed_hosts, startup=startup)


def __getattr__(name: str) -> Starlette:  # pragma: no cover – leniwe ``app`` dla uvicorn
    if name == "app":
        return create_production_app()
    raise AttributeError(name)
