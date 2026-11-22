"""Indeks wektorowy fragmentów: w pamięci (testy, demo) i pgvector (produkcja).

Kolumna ``embedding`` w Postgresie to ``vector`` bez stałego wymiaru – model embeddingów
nie jest jeszcze wybrany (ADR 0002), a przy kilkudziesięciu–kilkuset fragmentach
wyszukiwanie dokładne (bez indeksu HNSW, limit 2000 wymiarów) wystarcza. Wiersze są
rozróżnione nazwą modelu, więc zmiana modelu nie miesza wektorów różnych wymiarów.
"""

import math
from dataclasses import dataclass
from typing import Final, Protocol

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from assistant.rag.corpus import ChunkKind, KnowledgeChunk


@dataclass(frozen=True, slots=True)
class ScoredChunk:
    chunk: KnowledgeChunk
    score: float
    """Podobieństwo kosinusowe (1 = identyczne)."""


class KnowledgeIndex(Protocol):
    async def upsert(
        self, chunks: list[KnowledgeChunk], vectors: list[list[float]], model: str
    ) -> None: ...

    async def search(
        self, vector: list[float], kind: ChunkKind, model: str, limit: int
    ) -> list[ScoredChunk]: ...


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b, strict=True))
    norm = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(y * y for y in b))
    return dot / norm if norm else 0.0


class InMemoryKnowledgeIndex:
    def __init__(self) -> None:
        self._rows: dict[tuple[str, str], tuple[KnowledgeChunk, list[float]]] = {}

    async def upsert(
        self, chunks: list[KnowledgeChunk], vectors: list[list[float]], model: str
    ) -> None:
        for chunk, vector in zip(chunks, vectors, strict=True):
            self._rows[(chunk.id, model)] = (chunk, vector)

    async def search(
        self, vector: list[float], kind: ChunkKind, model: str, limit: int
    ) -> list[ScoredChunk]:
        scored = [
            ScoredChunk(chunk, cosine(vector, stored))
            for (_, row_model), (chunk, stored) in self._rows.items()
            if row_model == model and chunk.kind is kind
        ]
        return sorted(scored, key=lambda s: (-s.score, s.chunk.id))[:limit]


def vector_literal(vector: list[float]) -> str:
    return "[" + ",".join(repr(float(x)) for x in vector) + "]"


UPSERT_SQL: Final = text(
    """
    INSERT INTO knowledge_chunks
        (id, embedding_model, kind, title, text, url, act, article, to_verify,
         content_hash, embedding)
    VALUES
        (:id, :model, :kind, :title, :text, :url, :act, :article, :to_verify,
         :content_hash, CAST(:embedding AS vector))
    ON CONFLICT (id, embedding_model) DO UPDATE SET
        kind = EXCLUDED.kind, title = EXCLUDED.title, text = EXCLUDED.text,
        url = EXCLUDED.url, act = EXCLUDED.act, article = EXCLUDED.article,
        to_verify = EXCLUDED.to_verify, content_hash = EXCLUDED.content_hash,
        embedding = EXCLUDED.embedding
    """
)

SEARCH_SQL: Final = text(
    """
    SELECT id, kind, title, text, url, act, article, to_verify,
           1 - (embedding <=> CAST(:query AS vector)) AS score
    FROM knowledge_chunks
    WHERE embedding_model = :model AND kind = :kind
    ORDER BY embedding <=> CAST(:query AS vector), id
    LIMIT :limit
    """
)


class PgVectorKnowledgeIndex:
    """Tabela ``knowledge_chunks`` z migracji API (0002)."""

    def __init__(self, engine: AsyncEngine) -> None:
        self._engine = engine

    async def upsert(
        self, chunks: list[KnowledgeChunk], vectors: list[list[float]], model: str
    ) -> None:
        rows = [
            {
                "id": chunk.id,
                "model": model,
                "kind": chunk.kind.value,
                "title": chunk.title,
                "text": chunk.text,
                "url": str(chunk.url),
                "act": chunk.act,
                "article": chunk.article,
                "to_verify": chunk.to_verify,
                "content_hash": chunk.content_hash,
                "embedding": vector_literal(vector),
            }
            for chunk, vector in zip(chunks, vectors, strict=True)
        ]
        if rows:
            async with self._engine.begin() as connection:
                await connection.execute(UPSERT_SQL, rows)

    async def search(
        self, vector: list[float], kind: ChunkKind, model: str, limit: int
    ) -> list[ScoredChunk]:
        async with self._engine.connect() as connection:
            result = await connection.execute(
                SEARCH_SQL,
                {
                    "query": vector_literal(vector),
                    "model": model,
                    "kind": kind.value,
                    "limit": limit,
                },
            )
            rows = result.mappings().all()
        return [
            ScoredChunk(
                KnowledgeChunk(
                    id=row["id"],
                    kind=ChunkKind(row["kind"]),
                    title=row["title"],
                    text=row["text"],
                    url=row["url"],
                    act=row["act"],
                    article=row["article"],
                    to_verify=row["to_verify"],
                ),
                float(row["score"]),
            )
            for row in rows
        ]
