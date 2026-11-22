"""ZUS-35: korpus bazy wiedzy, indeks i wyszukiwanie (TM-17…TM-19, TM-18 na żywym modelu)."""

import json
from pathlib import Path
from typing import Any

import pytest
from pydantic import ValidationError

from assistant.llm import FakeEmbeddingClient, create_embedding_client
from assistant.rag import (
    ChunkKind,
    InMemoryKnowledgeIndex,
    KnowledgeBase,
    KnowledgeChunk,
    PgVectorKnowledgeIndex,
    Situation,
    SupportOrg,
    load_corpus,
    load_support_orgs,
    orgs_for,
)
from assistant.rag.corpus import SITUATION_CATEGORIES
from assistant.rag.index import cosine, vector_literal
from assistant.rag.ingest import embedding_model_name
from rules_engine.params.base import ACT_URLS, Act

KNOWLEDGE_DIR = Path(__file__).resolve().parents[3] / "data" / "knowledge"

#: Pytanie → przepis, który musi być w top-3 (AC ZUS-35; TM-18 na żywym modelu ≥ 9/10).
QUERIES: list[tuple[str, str]] = [
    ("Ile tygodni trwa urlop macierzyński przy bliźniętach?", "kp-180-wymiar"),
    ("Ile wynosi zasiłek macierzyński 81,5% czy 100%?", "uz-31-wysokosc"),
    ("Czy mogę pracować na pół etatu w trakcie urlopu rodzicielskiego?", "kp-182-1e-praca"),
    ("Jak długo przysługuje urlop ojcowski?", "kp-182-3-ojcowski"),
    ("Kto wypłaca zasiłek, pracodawca czy ZUS?", "uz-61-platnik"),
    ("Urodziłam martwe dziecko, jaki urlop mi przysługuje?", "kp-180-1-martwe-urodzenie"),
    ("Po ilu dniach zleceniobiorca dostanie zasiłek chorobowy?", "uz-4-okres-wyczekiwania"),
    ("Jak liczona jest podstawa wymiaru zasiłku?", "uz-36-podstawa"),
    ("Zasiłek chorobowy w ciąży ile procent?", "uz-11-chorobowy-ciaza"),
    ("Adopcja dziecka a urlop", "kp-183-adopcja"),
]


@pytest.fixture
async def knowledge() -> KnowledgeBase:
    base = KnowledgeBase(FakeEmbeddingClient(), InMemoryKnowledgeIndex(), "fake")
    await base.ingest_directory(KNOWLEDGE_DIR)
    return base


# --- korpus ------------------------------------------------------------------------------


def test_tm19_every_fragment_has_https_source() -> None:
    chunks = load_corpus(KNOWLEDGE_DIR)
    assert {c.kind for c in chunks} == {ChunkKind.LAW, ChunkKind.GUIDE}
    assert all(c.url.scheme == "https" for c in chunks)


def test_law_fragments_link_to_the_engine_act_pages() -> None:
    """Spójność z rejestrem podstaw prawnych silnika – ten sam akt, ten sam adres ISAP."""
    for chunk in load_corpus(KNOWLEDGE_DIR):
        if chunk.kind is ChunkKind.LAW:
            assert chunk.act is not None
            assert str(chunk.url) == ACT_URLS[Act(chunk.act)], chunk.id
            assert chunk.article


def test_support_orgs_cover_every_situation() -> None:
    orgs = load_support_orgs(KNOWLEDGE_DIR)
    for situation in Situation:
        assert orgs_for(orgs, situation), situation
    known = {c for categories in SITUATION_CATEGORIES.values() for c in categories}
    assert {c for org in orgs for c in org.categories} <= known


def _chunk(**overrides: Any) -> dict[str, Any]:
    return {
        "id": "x",
        "kind": "LAW",
        "title": "t",
        "text": "tekst",
        "url": "https://zus.pl",
        **overrides,
    }


def test_http_source_is_rejected() -> None:
    with pytest.raises(ValidationError, match="https"):
        KnowledgeChunk.model_validate(_chunk(url="http://zus.pl"))
    with pytest.raises(ValidationError, match="https"):
        SupportOrg.model_validate(
            {
                "id": "o",
                "name": "n",
                "description": "d",
                "url": "http://x.pl",
                "categories": ["żałoba"],
            }
        )


def test_duplicate_fragment_ids_are_rejected(tmp_path: Path) -> None:
    fragment = {"id": "same", "title": "t", "text": "t", "url": "https://zus.pl"}
    (tmp_path / "law.json").write_text(json.dumps({"fragments": [fragment]}), encoding="utf-8")
    (tmp_path / "guides.json").write_text(json.dumps({"fragments": [fragment]}), encoding="utf-8")
    with pytest.raises(ValueError, match="powtórzone"):
        load_corpus(tmp_path)


def test_content_hash_changes_with_text() -> None:
    first = KnowledgeChunk.model_validate(_chunk())
    second = KnowledgeChunk.model_validate(_chunk(text="inny tekst"))
    assert first.content_hash != second.content_hash
    assert first.content_hash == KnowledgeChunk.model_validate(_chunk()).content_hash


# --- wyszukiwanie ------------------------------------------------------------------------


@pytest.mark.parametrize(("query", "expected"), QUERIES)
async def test_tm17_expected_article_in_top3(
    knowledge: KnowledgeBase, query: str, expected: str
) -> None:
    results = await knowledge.search(query, ChunkKind.LAW, 3)
    assert expected in [r.chunk.id for r in results]


async def test_search_respects_kind_and_limit(knowledge: KnowledgeBase) -> None:
    guides = await knowledge.search("zasiłek macierzyński", ChunkKind.GUIDE, 100)
    assert len(guides) == 8  # limit przycięty do 10, poradników jest 8
    assert all(r.chunk.kind is ChunkKind.GUIDE for r in guides)
    assert len(await knowledge.search("urlop", ChunkKind.LAW, 0)) == 1
    scores = [r.score for r in guides]
    assert scores == sorted(scores, reverse=True)


async def test_index_separates_embedding_models() -> None:
    index = InMemoryKnowledgeIndex()
    chunk = KnowledgeChunk.model_validate(_chunk())
    await index.upsert([chunk], [[1.0, 0.0]], "model-a")
    assert await index.search([1.0, 0.0], ChunkKind.LAW, "model-b", 3) == []
    [found] = await index.search([1.0, 0.0], ChunkKind.LAW, "model-a", 3)
    assert found.score == 1.0


def test_vector_helpers() -> None:
    assert vector_literal([1, 0.5]) == "[1.0,0.5]"
    assert cosine([0.0, 0.0], [1.0, 0.0]) == 0.0


def test_embedding_model_name() -> None:
    assert embedding_model_name({}) == "fake"
    assert embedding_model_name({"EMBEDDING_MODEL": " bge-m3 "}) == "bge-m3"


# --- integracja i żywy model -------------------------------------------------------------


@pytest.mark.integration
async def test_pgvector_index_roundtrip(pg_url: str) -> None:
    from sqlalchemy.ext.asyncio import create_async_engine

    from api.db import migrate

    migrate.upgrade(pg_url)
    engine = create_async_engine(pg_url)
    base = KnowledgeBase(FakeEmbeddingClient(), PgVectorKnowledgeIndex(engine), "fake")
    count = await base.ingest_directory(KNOWLEDGE_DIR)
    await base.ingest_directory(KNOWLEDGE_DIR)  # idempotentnie
    results = await base.search("Jak długo przysługuje urlop ojcowski?", ChunkKind.LAW, 3)
    await engine.dispose()
    assert count == len(load_corpus(KNOWLEDGE_DIR))
    assert results[0].chunk.id == "kp-182-3-ojcowski"
    assert str(results[0].chunk.url).startswith("https://isap.sejm.gov.pl/")


@pytest.mark.live_llm
async def test_tm18_live_embeddings_top3() -> None:
    embedder = create_embedding_client()
    base = KnowledgeBase(embedder, InMemoryKnowledgeIndex(), embedding_model_name())
    await base.ingest_directory(KNOWLEDGE_DIR)
    hits = 0
    for query, expected in QUERIES:
        results = await base.search(query, ChunkKind.LAW, 3)
        hits += expected in [r.chunk.id for r in results]
    await embedder.aclose()
    assert hits >= 9, f"top-3: {hits}/{len(QUERIES)}"
