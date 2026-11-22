-- Uruchamiane raz, przy tworzeniu pustego wolumenu bazy (docker-entrypoint-initdb.d).
-- pgvector dla RAG (ZUS-35). Migracje Alembic też wołają CREATE EXTENSION IF NOT EXISTS,
-- więc baza bez tego skryptu (np. testcontainers) działa tak samo.
CREATE EXTENSION IF NOT EXISTS vector;
