"""Serwer ``wiedza``: przepisy i poradniki z linkiem (RAG) oraz organizacje wsparcia (§7, ZUS-35).

Każdy wynik ma adres źródła (TM-19) – asystent cytuje tylko to, co ma źródło; bez źródła
pytanie trafia do urzędnika (ZUS-55). Zapytanie użytkownika trafia do modelu embeddingów,
więc przed wywołaniem orkiestrator je pseudonimizuje (ZUS-54).
"""

from typing import Annotated, Final

from mcp.server.mcpserver import MCPServer
from pydantic import Field, HttpUrl

from assistant.rag import ChunkKind, KnowledgeBase, Situation, SupportOrg, orgs_for
from contracts._base import ContractModel
from mcp_servers.common.errors import handles_errors
from mcp_servers.common.runtime import ServerDeps, create_server

NAME = "wiedza"
DEFAULT_LIMIT: Final = 3

Query = Annotated[str, Field(min_length=2, max_length=500, description="Pytanie lub fraza")]
Limit = Annotated[int, Field(ge=1, le=10, description="Liczba wyników")]


class Fragment(ContractModel):
    id: str
    title: str
    text: str
    url: HttpUrl
    act: str | None
    article: str | None
    to_verify: bool
    score: float


class SearchResults(ContractModel):
    results: list[Fragment]


class SupportOrgs(ContractModel):
    situation: Situation
    organizations: list[SupportOrg]


def build(deps: ServerDeps) -> MCPServer:
    if deps.knowledge is None:
        raise ValueError("serwer wiedza wymaga bazy wiedzy (ServerDeps.knowledge)")
    knowledge: KnowledgeBase = deps.knowledge
    server = create_server(
        NAME,
        "Przepisy i poradniki ZUS/gov.pl z linkami oraz organizacje wsparcia. Cytuj tylko wyniki.",
        deps,
    )

    async def search(query: str, kind: ChunkKind, limit: int) -> SearchResults:
        found = await knowledge.search(query, kind, limit)
        return SearchResults(
            results=[
                Fragment(
                    id=s.chunk.id,
                    title=s.chunk.title,
                    text=s.chunk.text,
                    url=s.chunk.url,
                    act=s.chunk.act,
                    article=s.chunk.article,
                    to_verify=s.chunk.to_verify,
                    score=round(s.score, 4),
                )
                for s in found
            ]
        )

    @server.tool()
    @handles_errors
    async def search_law(query: Query, limit: Limit = DEFAULT_LIMIT) -> SearchResults:
        """Streszczenia przepisów (Kodeks pracy, ustawa zasiłkowa) z linkiem do aktu w ISAP."""
        return await search(query, ChunkKind.LAW, limit)

    @server.tool()
    @handles_errors
    async def search_guides(query: Query, limit: Limit = DEFAULT_LIMIT) -> SearchResults:
        """Poradniki ZUS i gov.pl z linkiem do strony źródłowej."""
        return await search(query, ChunkKind.GUIDE, limit)

    @server.tool()
    @handles_errors
    async def list_support_orgs(situation: Situation) -> SupportOrgs:
        """Organizacje wsparcia dla sytuacji trudnej (żałoba, poronienie, wcześniaki, choroba)."""
        return SupportOrgs(
            situation=situation, organizations=orgs_for(deps.support_orgs, situation)
        )

    return server
