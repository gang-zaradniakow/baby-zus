"""Wyszukiwanie w bazie wiedzy (pgvector) dla pytań spoza katalogu (ZUS-35, 55)."""

from assistant.rag.corpus import (
    ChunkKind,
    KnowledgeChunk,
    Situation,
    SupportOrg,
    load_corpus,
    load_support_orgs,
    orgs_for,
)
from assistant.rag.index import (
    InMemoryKnowledgeIndex,
    KnowledgeIndex,
    PgVectorKnowledgeIndex,
    ScoredChunk,
)
from assistant.rag.service import KnowledgeBase

__all__ = [
    "ChunkKind",
    "InMemoryKnowledgeIndex",
    "KnowledgeBase",
    "KnowledgeChunk",
    "KnowledgeIndex",
    "PgVectorKnowledgeIndex",
    "ScoredChunk",
    "Situation",
    "SupportOrg",
    "load_corpus",
    "load_support_orgs",
    "orgs_for",
]
