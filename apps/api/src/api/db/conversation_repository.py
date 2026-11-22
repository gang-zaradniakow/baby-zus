"""Historia czatu i analityka na Postgresie (tabele ``messages`` i ``analytics_events``)."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from api.db.models import AnalyticsEvent, Message, MessageRole
from api.services.conversations import AnalyticsRecord, MessageRecord


def _record(row: Message) -> MessageRecord:
    return MessageRecord(
        seq=row.seq,
        role=row.role,
        level=row.level,
        content=row.content,
        intent_id=row.intent_id,
        card=row.card,
        created_at=row.created_at,
    )


class SqlConversationRepository:
    def __init__(self, sessionmaker: async_sessionmaker[AsyncSession]) -> None:
        self._sessionmaker = sessionmaker

    async def append_message(
        self,
        session_id: uuid.UUID,
        *,
        role: MessageRole,
        level: int,
        content: str,
        created_at: datetime,
        intent_id: str | None = None,
        card: dict[str, Any] | None = None,
    ) -> MessageRecord:
        async with self._sessionmaker.begin() as db:
            last = await db.scalar(
                select(func.coalesce(func.max(Message.seq), 0)).where(
                    Message.session_id == session_id
                )
            )
            row = Message(
                session_id=session_id,
                seq=int(last or 0) + 1,
                role=role,
                level=level,
                content=content,
                intent_id=intent_id,
                card=card,
                created_at=created_at,
            )
            db.add(row)
        return _record(row)

    async def list_messages(self, session_id: uuid.UUID) -> list[MessageRecord]:
        async with self._sessionmaker() as db:
            rows = await db.scalars(
                select(Message).where(Message.session_id == session_id).order_by(Message.seq)
            )
            return [_record(row) for row in rows]

    async def record_event(self, event: AnalyticsRecord) -> None:
        async with self._sessionmaker.begin() as db:
            db.add(
                AnalyticsEvent(
                    occurred_at=event.occurred_at,
                    session_id=event.session_id,
                    level=event.level,
                    event_type=event.event_type,
                    intent_id=event.intent_id,
                    verdict=event.verdict,
                    payload=event.payload,
                )
            )
