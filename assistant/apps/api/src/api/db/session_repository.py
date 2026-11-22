"""Repozytorium sesji na Postgresie (tabela ``sessions``)."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from api.db.models import AuthMode, ChatSession
from api.services.sessions import SessionRecord


def _record(row: ChatSession) -> SessionRecord:
    return SessionRecord(
        id=row.id,
        user_ref=row.user_ref,
        auth_mode=row.auth_mode,
        profile=row.profile,
        created_at=row.created_at,
        expires_at=row.expires_at,
        revoked_at=row.revoked_at,
    )


class SqlSessionRepository:
    def __init__(self, sessionmaker: async_sessionmaker[AsyncSession]) -> None:
        self._sessionmaker = sessionmaker

    async def create(
        self,
        *,
        token_hash: str,
        user_ref: str,
        auth_mode: AuthMode,
        profile: dict[str, Any] | None,
        created_at: datetime,
        expires_at: datetime,
    ) -> SessionRecord:
        row = ChatSession(
            id=uuid.uuid4(),
            token_hash=token_hash,
            user_ref=user_ref,
            auth_mode=auth_mode,
            profile=profile,
            created_at=created_at,
            expires_at=expires_at,
        )
        async with self._sessionmaker.begin() as db:
            db.add(row)
        return _record(row)

    async def get_by_token_hash(self, token_hash: str) -> SessionRecord | None:
        async with self._sessionmaker() as db:
            row = await db.scalar(select(ChatSession).where(ChatSession.token_hash == token_hash))
        return None if row is None else _record(row)

    async def revoke(self, session_id: uuid.UUID, at: datetime) -> None:
        async with self._sessionmaker.begin() as db:
            await db.execute(
                update(ChatSession)
                .where(ChatSession.id == session_id, ChatSession.revoked_at.is_(None))
                .values(revoked_at=at)
            )

    async def update_profile(self, session_id: uuid.UUID, profile: dict[str, Any]) -> None:
        async with self._sessionmaker.begin() as db:
            await db.execute(
                update(ChatSession).where(ChatSession.id == session_id).values(profile=profile)
            )
