"""Baza wiedzy: korpus → embeddingi → indeks; wyszukiwanie przepisów i poradników (ZUS-35)."""

from dataclasses import dataclass
from pathlib import Path
from typing import Final

from assistant.llm.base import EmbeddingClient
from assistant.rag.corpus import ChunkKind, KnowledgeChunk, load_corpus
from assistant.rag.index import KnowledgeIndex, ScoredChunk

EMBED_BATCH: Final = 32
MAX_LIMIT: Final = 10


@dataclass
class KnowledgeBase:
    embedder: EmbeddingClient
    index: KnowledgeIndex
    model: str
    """Nazwa modelu embeddingów – rozdziela wektory różnych modeli w indeksie."""

    async def ingest(self, chunks: list[KnowledgeChunk]) -> int:
        for start in range(0, len(chunks), EMBED_BATCH):
            batch = chunks[start : start + EMBED_BATCH]
            vectors = await self.embedder.embed([c.embedding_text() for c in batch])
            await self.index.upsert(batch, vectors, self.model)
        return len(chunks)

    async def ingest_directory(self, directory: Path) -> int:
        return await self.ingest(load_corpus(directory))

    async def search(self, query: str, kind: ChunkKind, limit: int = 3) -> list[ScoredChunk]:
        limit = max(1, min(limit, MAX_LIMIT))
        [vector] = await self.embedder.embed([query])
        return await self.index.search(vector, kind, self.model, limit)
