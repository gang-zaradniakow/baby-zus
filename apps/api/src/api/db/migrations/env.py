"""Środowisko Alembic: tryb offline (generowanie SQL) i online (async, asyncpg)."""

import asyncio

from alembic import context
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

from api.db.models import Base

config = context.config
target_metadata = Base.metadata
url = config.get_main_option("sqlalchemy.url")


def run_offline() -> None:
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def _run(connection: Connection) -> None:  # pragma: no cover – j.w.
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_online() -> None:  # pragma: no cover – testy integracyjne (TA-03, Docker)
    engine = create_async_engine(str(url), poolclass=NullPool)
    async with engine.connect() as connection:
        await connection.run_sync(_run)
    await engine.dispose()


if context.is_offline_mode():
    run_offline()
else:  # pragma: no cover – testy integracyjne (TA-03, Docker)
    asyncio.run(run_online())
