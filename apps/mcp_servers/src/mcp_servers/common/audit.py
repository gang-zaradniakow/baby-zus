"""Log audytu wywołań MCP (§7: kto, kiedy, jakie narzędzie, jaki wynik) – widoczny w panelu.

Wpis nie zawiera argumentów ani wyników narzędzia (dane osobowe), tylko pseudonim, nazwę
narzędzia, wynik OK/ERROR i kod błędu. Wersja SQL pisze do tabeli ``audit_log`` z migracji
API (ZUS-40); wersja w pamięci służy testom.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Final, Protocol

from sqlalchemy import JSON, Column, DateTime, MetaData, String, Table, Uuid, insert
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncEngine

ACTION_MCP_CALL: Final = "MCP_CALL"


@dataclass(frozen=True, slots=True)
class AuditEntry:
    occurred_at: datetime
    tool: str
    """``serwer.narzędzie``, np. ``zus-ezla.list_sick_leaves``."""
    outcome: str
    """``OK`` albo ``ERROR``."""
    actor_ref: str | None = None
    session_id: str | None = None
    action: str = ACTION_MCP_CALL
    details: dict[str, Any] = field(default_factory=dict)


class AuditSink(Protocol):
    async def record(self, entry: AuditEntry) -> None: ...


class InMemoryAuditSink:
    def __init__(self) -> None:
        self.entries: list[AuditEntry] = []

    async def record(self, entry: AuditEntry) -> None:
        self.entries.append(entry)


# Tylko kolumny zapisywane przez MCP; schemat tabeli należy do migracji API.
_audit_log = Table(
    "audit_log",
    MetaData(),
    Column("occurred_at", DateTime(timezone=True)),
    Column("session_id", Uuid()),
    Column("actor_ref", String(64)),
    Column("action", String(64)),
    Column("tool", String(128)),
    Column("outcome", String(32)),
    Column("details", JSON().with_variant(JSONB(), "postgresql")),
)


def _session_uuid(session_id: str | None) -> uuid.UUID | None:
    try:
        return uuid.UUID(session_id) if session_id else None
    except ValueError:
        return None


class SqlAuditSink:
    def __init__(self, engine: AsyncEngine) -> None:
        self._engine = engine

    async def record(self, entry: AuditEntry) -> None:
        async with self._engine.begin() as connection:
            await connection.execute(
                insert(_audit_log).values(
                    occurred_at=entry.occurred_at,
                    session_id=_session_uuid(entry.session_id),
                    actor_ref=entry.actor_ref,
                    action=entry.action,
                    tool=entry.tool,
                    outcome=entry.outcome,
                    details=entry.details or None,
                )
            )
