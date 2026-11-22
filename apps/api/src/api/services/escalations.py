"""Eskalacje do urzędnika (ZUS-44): szkic → akceptacja użytkownika → wysyłka (§8).

Stany: ``DRAFT`` (szkic paczki, nic nie wyszło) → ``CONFIRMED`` (użytkownik zaakceptował,
trwa wysyłka) → ``SENT`` (jest numer sprawy). ``claim`` przechodzi DRAFT → CONFIRMED
atomowo, więc dwa równoczesne potwierdzenia nie wyślą paczki dwa razy; przy błędzie
wysyłki ``release`` przywraca szkic. Potwierdzenie wysłanej eskalacji zwraca ten sam wynik
(idempotencja, TA-27).
"""

import asyncio
import uuid
from dataclasses import dataclass, replace
from datetime import datetime
from typing import Any, Protocol

from api.db.models import EscalationChannel, EscalationStatus


@dataclass(frozen=True, slots=True)
class EscalationRecord:
    id: uuid.UUID
    session_id: uuid.UUID | None
    status: EscalationStatus
    channel: EscalationChannel
    summary: str
    package: dict[str, Any]
    created_at: datetime
    external_case_id: str | None = None
    confirmed_at: datetime | None = None


class EscalationRepository(Protocol):
    async def create(
        self,
        *,
        session_id: uuid.UUID,
        channel: EscalationChannel,
        summary: str,
        package: dict[str, Any],
        created_at: datetime,
    ) -> EscalationRecord: ...

    async def get(self, escalation_id: uuid.UUID) -> EscalationRecord | None: ...

    async def claim(self, escalation_id: uuid.UUID, at: datetime) -> bool:
        """DRAFT → CONFIRMED; ``False``, gdy szkic był już przejęty albo wysłany."""
        ...

    async def release(self, escalation_id: uuid.UUID) -> None:
        """CONFIRMED → DRAFT po nieudanej wysyłce."""
        ...

    async def mark_sent(self, escalation_id: uuid.UUID, external_case_id: str) -> None: ...


class InMemoryEscalationRepository:
    def __init__(self) -> None:
        self._rows: dict[uuid.UUID, EscalationRecord] = {}
        self._lock = asyncio.Lock()

    async def create(
        self,
        *,
        session_id: uuid.UUID,
        channel: EscalationChannel,
        summary: str,
        package: dict[str, Any],
        created_at: datetime,
    ) -> EscalationRecord:
        record = EscalationRecord(
            id=uuid.uuid4(),
            session_id=session_id,
            status=EscalationStatus.DRAFT,
            channel=channel,
            summary=summary,
            package=package,
            created_at=created_at,
        )
        self._rows[record.id] = record
        return record

    async def get(self, escalation_id: uuid.UUID) -> EscalationRecord | None:
        return self._rows.get(escalation_id)

    async def claim(self, escalation_id: uuid.UUID, at: datetime) -> bool:
        async with self._lock:
            record = self._rows.get(escalation_id)
            if record is None or record.status is not EscalationStatus.DRAFT:
                return False
            self._rows[escalation_id] = replace(
                record, status=EscalationStatus.CONFIRMED, confirmed_at=at
            )
            return True

    async def release(self, escalation_id: uuid.UUID) -> None:
        record = self._rows[escalation_id]
        self._rows[escalation_id] = replace(
            record, status=EscalationStatus.DRAFT, confirmed_at=None
        )

    async def mark_sent(self, escalation_id: uuid.UUID, external_case_id: str) -> None:
        record = self._rows[escalation_id]
        self._rows[escalation_id] = replace(
            record, status=EscalationStatus.SENT, external_case_id=external_case_id
        )
