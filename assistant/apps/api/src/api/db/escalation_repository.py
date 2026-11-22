"""Eskalacje na Postgresie (tabela ``escalations``); przejęcie szkicu jednym UPDATE."""

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from api.db.models import Escalation, EscalationChannel, EscalationStatus
from api.services.escalations import EscalationRecord


def _record(row: Escalation) -> EscalationRecord:
    return EscalationRecord(
        id=row.id,
        session_id=row.session_id,
        status=row.status,
        channel=row.channel,
        summary=row.summary,
        package=row.package,
        created_at=row.created_at,
        external_case_id=row.external_case_id,
        confirmed_at=row.confirmed_at,
    )


class SqlEscalationRepository:
    def __init__(self, sessionmaker: async_sessionmaker[AsyncSession]) -> None:
        self._sessionmaker = sessionmaker

    async def create(
        self,
        *,
        session_id: uuid.UUID,
        channel: EscalationChannel,
        summary: str,
        package: dict[str, Any],
        created_at: datetime,
    ) -> EscalationRecord:
        row = Escalation(
            id=uuid.uuid4(),
            session_id=session_id,
            status=EscalationStatus.DRAFT,
            channel=channel,
            summary=summary,
            package=package,
            created_at=created_at,
        )
        async with self._sessionmaker.begin() as db:
            db.add(row)
        return _record(row)

    async def get(self, escalation_id: uuid.UUID) -> EscalationRecord | None:
        async with self._sessionmaker() as db:
            row = await db.get(Escalation, escalation_id)
        return None if row is None else _record(row)

    async def claim(self, escalation_id: uuid.UUID, at: datetime) -> bool:
        async with self._sessionmaker.begin() as db:
            result = await db.execute(
                update(Escalation)
                .where(Escalation.id == escalation_id, Escalation.status == EscalationStatus.DRAFT)
                .values(status=EscalationStatus.CONFIRMED, confirmed_at=at)
                .returning(Escalation.id)
            )
            return result.first() is not None

    async def release(self, escalation_id: uuid.UUID) -> None:
        async with self._sessionmaker.begin() as db:
            await db.execute(
                update(Escalation)
                .where(Escalation.id == escalation_id)
                .values(status=EscalationStatus.DRAFT, confirmed_at=None)
            )

    async def mark_sent(self, escalation_id: uuid.UUID, external_case_id: str) -> None:
        async with self._sessionmaker.begin() as db:
            await db.execute(
                update(Escalation)
                .where(Escalation.id == escalation_id)
                .values(status=EscalationStatus.SENT, external_case_id=external_case_id)
            )
