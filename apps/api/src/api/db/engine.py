"""Silnik SQLAlchemy (async, asyncpg) i sprawdzanie dostępności bazy."""

import asyncio
import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

logger = logging.getLogger(__name__)


def create_engine(database_url: str) -> AsyncEngine:
    """Pula połączeń z ``pool_pre_ping`` – zerwane połączenia nie trafiają do żądań."""
    return create_async_engine(database_url, pool_pre_ping=True)


def create_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


async def database_is_up(engine: AsyncEngine, timeout_s: float) -> bool:
    """``SELECT 1`` w limicie czasu; każdy błąd (timeout, sieć, sterownik) = baza niedostępna."""
    try:
        async with asyncio.timeout(timeout_s), engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception as error:  # sterowniki zgłaszają różne typy błędów połączenia
        logger.warning("Baza niedostępna: %s", type(error).__name__)
        return False
    return True
