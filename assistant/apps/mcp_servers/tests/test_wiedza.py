"""ZUS-35: serwer wiedza – przepisy i poradniki z URL, organizacje wsparcia (TM-17…TM-21)."""

from collections.abc import Awaitable, Callable
from typing import Any

import pytest
from mcp_types import CallToolResult

from assistant.llm import LLMUnavailableError
from assistant.rag import InMemoryKnowledgeIndex, KnowledgeBase
from mcp_servers.common.runtime import ServerDeps
from mcp_servers.wiedza import server as wiedza

Call = Callable[..., Awaitable[CallToolResult]]


def ok(result: CallToolResult) -> dict[str, Any]:
    assert not result.is_error, result.structured_content
    assert result.structured_content is not None
    return result.structured_content


async def test_tm17_law_search_ranks_the_right_article_first(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(
            wiedza.build(deps),
            "search_law",
            {"query": "Urodziłam martwe dziecko, jaki urlop mi przysługuje?"},
        )
    )
    assert data["results"][0]["id"] == "kp-180-1-martwe-urodzenie"
    assert len(data["results"]) == 3


async def test_tm19_every_result_has_url(deps: ServerDeps, call: Call) -> None:
    server = wiedza.build(deps)
    for tool in ("search_law", "search_guides"):
        data = ok(await call(server, tool, {"query": "zasiłek macierzyński wysokość", "limit": 10}))
        assert data["results"]
        assert all(r["url"].startswith("https://") for r in data["results"])
    law = ok(await call(server, "search_law", {"query": "kto wypłaca zasiłek", "limit": 1}))
    assert law["results"][0]["act"] == "ustawa zasiłkowa"
    assert law["results"][0]["url"].startswith("https://isap.sejm.gov.pl/")


async def test_guides_point_to_zus_or_gov(deps: ServerDeps, call: Call) -> None:
    data = ok(
        await call(
            wiedza.build(deps), "search_guides", {"query": "wcześniak szpital urlop", "limit": 10}
        )
    )
    hosts = {r["url"].split("/")[2] for r in data["results"]}
    assert hosts <= {"www.zus.pl", "www.gov.pl"}


async def test_tm20_stillbirth_gives_bereavement_organisations(
    deps: ServerDeps, call: Call
) -> None:
    data = ok(await call(wiedza.build(deps), "list_support_orgs", {"situation": "STILLBIRTH"}))
    orgs = data["organizations"]
    assert orgs
    assert all("żałoba" in org["categories"] for org in orgs)
    assert all(org["url"] is None or org["url"].startswith("https://") for org in orgs)
    assert any(org["toVerify"] for org in orgs) == any(org["url"] is None for org in orgs)


async def test_miscarriage_lists_miscarriage_orgs_first(deps: ServerDeps, call: Call) -> None:
    data = ok(await call(wiedza.build(deps), "list_support_orgs", {"situation": "MISCARRIAGE"}))
    categories = [org["categories"] for org in data["organizations"]]
    assert "poronienie" in categories[0]


async def test_premature_birth_orgs(deps: ServerDeps, call: Call) -> None:
    data = ok(await call(wiedza.build(deps), "list_support_orgs", {"situation": "PREMATURE_BIRTH"}))
    assert [org["id"] for org in data["organizations"]] == ["fundacja-wczesniak"]


@pytest.mark.parametrize(
    ("tool", "arguments"),
    [
        ("list_support_orgs", {"situation": "WEEKEND"}),
        ("search_law", {"query": "a"}),
        ("search_law", {"query": "urlop", "limit": 50}),
    ],
)
async def test_bad_arguments(
    deps: ServerDeps, call: Call, tool: str, arguments: dict[str, Any]
) -> None:
    result = await call(wiedza.build(deps), tool, arguments)
    assert result.is_error
    assert result.structured_content is not None
    assert result.structured_content["code"] == "INVALID_ARGUMENTS"


class _BrokenEmbedder:
    dimension = None

    async def embed(self, texts: list[str]) -> list[list[float]]:
        raise RuntimeError("klucz API sk-tajny w stack trace")

    async def aclose(self) -> None:
        return None


class _UnavailableEmbedder(_BrokenEmbedder):
    async def embed(self, texts: list[str]) -> list[list[float]]:
        raise LLMUnavailableError("timeout", 3)


@pytest.mark.parametrize("embedder", [_BrokenEmbedder(), _UnavailableEmbedder()])
async def test_tm21_exception_is_internal_without_details(
    deps: ServerDeps, call: Call, embedder: _BrokenEmbedder
) -> None:
    broken = ServerDeps(
        deps.profile_source,
        deps.signer,
        deps.audit,
        deps.clock,
        knowledge=KnowledgeBase(embedder, InMemoryKnowledgeIndex(), "fake"),
    )
    result = await call(wiedza.build(broken), "search_law", {"query": "urlop macierzyński"})
    assert result.is_error
    assert result.structured_content is not None
    assert result.structured_content["code"] == "INTERNAL"
    assert "sk-tajny" not in str(result.content)
    assert "Traceback" not in str(result.content)


def test_wiedza_requires_knowledge_base(deps: ServerDeps) -> None:
    bare = ServerDeps(deps.profile_source, deps.signer, deps.audit, deps.clock)
    with pytest.raises(ValueError, match="bazy wiedzy"):
        wiedza.build(bare)
