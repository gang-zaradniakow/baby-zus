"""Historia czatu i analityka pytań poziomów 2–3 (ZUS-43).

Historia: wiadomości sesji w kolejności (``seq``), widoczne tylko w tej sesji (TA-22, TA-23).
Analityka: rodzaj odpowiedzi, intencja i werdykt – bez treści pytania (panel pokazuje
najczęstsze pytania jako intencje, §2). Dwie implementacje jak dla sesji: SQL i w pamięci.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Protocol

from api.db.models import MessageRole


@dataclass(frozen=True, slots=True)
class MessageRecord:
    seq: int
    role: MessageRole
    level: int
    content: str
    intent_id: str | None
    card: dict[str, Any] | None
    created_at: datetime


@dataclass(frozen=True, slots=True)
class AnalyticsRecord:
    session_id: uuid.UUID | None
    level: int
    event_type: str
    intent_id: str | None
    verdict: str | None
    payload: dict[str, Any] | None
    occurred_at: datetime


class ConversationRepository(Protocol):
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
    ) -> MessageRecord: ...

    async def list_messages(self, session_id: uuid.UUID) -> list[MessageRecord]: ...

    async def record_event(self, event: AnalyticsRecord) -> None: ...


class InMemoryConversationRepository:
    def __init__(self) -> None:
        self._messages: dict[uuid.UUID, list[MessageRecord]] = {}
        self.events: list[AnalyticsRecord] = []

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
        messages = self._messages.setdefault(session_id, [])
        record = MessageRecord(
            seq=len(messages) + 1,
            role=role,
            level=level,
            content=content,
            intent_id=intent_id,
            card=card,
            created_at=created_at,
        )
        messages.append(record)
        return record

    async def list_messages(self, session_id: uuid.UUID) -> list[MessageRecord]:
        return list(self._messages.get(session_id, []))

    async def record_event(self, event: AnalyticsRecord) -> None:
        self.events.append(event)
