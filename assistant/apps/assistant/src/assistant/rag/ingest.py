"""Wczytanie korpusu ``data/knowledge`` do pgvector (ZUS-35).

    python -m assistant.rag.ingest                    # DATABASE_URL, EMBEDDING_*
    python -m assistant.rag.ingest --dir data/knowledge

Idempotentne: ponowne uruchomienie nadpisuje fragmenty (klucz: fragment + model embeddingów).
Indeks w pamięci (``KNOWLEDGE_INDEX=memory``) serwer ``wiedza`` buduje sam przy starcie.
"""

import argparse
import asyncio
import os
import sys
from pathlib import Path
from typing import Final

from sqlalchemy.ext.asyncio import create_async_engine

from assistant.llm.factory import create_embedding_client
from assistant.rag.index import PgVectorKnowledgeIndex
from assistant.rag.service import KnowledgeBase

DEFAULT_DIR: Final = Path("data/knowledge")
FAKE_MODEL: Final = "fake"


def embedding_model_name(env: dict[str, str] | None = None) -> str:
    """Nazwa modelu w indeksie – ta sama w ``ingest`` i w serwerze ``wiedza``."""
    env = dict(os.environ) if env is None else env
    return env.get("EMBEDDING_MODEL", "").strip() or FAKE_MODEL


async def run(directory: Path, database_url: str) -> int:  # pragma: no cover – wymaga bazy
    engine = create_async_engine(database_url)
    embedder = create_embedding_client()
    try:
        knowledge = KnowledgeBase(embedder, PgVectorKnowledgeIndex(engine), embedding_model_name())
        return await knowledge.ingest_directory(directory)
    finally:
        await embedder.aclose()
        await engine.dispose()


def main(argv: list[str] | None = None) -> int:  # pragma: no cover – CLI na produkcyjnej bazie
    parser = argparse.ArgumentParser(description="Wczytanie bazy wiedzy do pgvector.")
    parser.add_argument("--dir", type=Path, default=DEFAULT_DIR, help="katalog korpusu")
    args = parser.parse_args(argv)
    count = asyncio.run(run(args.dir, os.environ["DATABASE_URL"]))
    print(f"wczytano {count} fragmentów do knowledge_chunks")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
