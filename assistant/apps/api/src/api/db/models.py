"""Tabele API (ZUS-40): sesje, wiadomości, log audytu, analityka, eskalacje; baza wiedzy (ZUS-35).

Zasady danych (§9.1): ``user_ref`` to pseudonim (nigdy PESEL); token sesji tylko jako skrót
SHA-256. Usunięcie sesji (prawo do usunięcia historii, ZUS-45) kasuje wiadomości, a wpisy
audytu, analityki i eskalacji zostają bez powiązania z sesją (``ON DELETE SET NULL``).
"""

import uuid
from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Identity,
    Index,
    MetaData,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from api.db.types import Vector

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def _enum[E: StrEnum](enum: type[E], name: str) -> Enum:
    """Enum jako VARCHAR + CHECK – nowe wartości bez ALTER TYPE."""
    return Enum(
        enum,
        name=name,
        native_enum=False,
        create_constraint=True,
        length=32,
        values_callable=lambda members: [m.value for m in members],
    )


class AuthMode(StrEnum):
    MOBYWATEL = "MOBYWATEL"
    """Symulowane logowanie mObywatel – profil z ProfileSource (ZUS-41)."""
    ANONYMOUS = "ANONYMOUS"
    """Tryb bez logowania – profil z formularza (źródło USER)."""


class MessageRole(StrEnum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"


class AuditOutcome(StrEnum):
    OK = "OK"
    ERROR = "ERROR"


class EscalationStatus(StrEnum):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    SENT = "SENT"


class EscalationChannel(StrEnum):
    PUE_MESSAGE = "PUE_MESSAGE"
    EVISIT = "EVISIT"
    BRANCH_VISIT = "BRANCH_VISIT"


def _now() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now())


class ChatSession(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    user_ref: Mapped[str] = mapped_column(String(64), index=True)
    auth_mode: Mapped[AuthMode] = mapped_column(_enum(AuthMode, "auth_mode"))
    profile: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    """Profil z formularza (tryb ANONYMOUS); przy mObywatelu profil daje ProfileSource."""
    created_at: Mapped[datetime] = _now()
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    messages: Mapped[list[Message]] = relationship(
        back_populates="session", cascade="all, delete-orphan", passive_deletes=True
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (UniqueConstraint("session_id", "seq", name="session_seq"),)

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"))
    seq: Mapped[int]
    """Kolejność w rozmowie (historia czatu, TA-22)."""
    role: Mapped[MessageRole] = mapped_column(_enum(MessageRole, "message_role"))
    level: Mapped[int] = mapped_column(SmallInteger)
    """Poziom obsługi: 1 lista, 2 czat, 3 eskalacja."""
    content: Mapped[str] = mapped_column(Text)
    intent_id: Mapped[str | None] = mapped_column(String(64))
    card: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    """AnswerCard odpowiedzi (JSON kontraktu)."""
    created_at: Mapped[datetime] = _now()

    session: Mapped[ChatSession] = relationship(back_populates="messages")


class AuditEntry(Base):
    """Kto, kiedy, jakie narzędzie, jaki wynik (§7) – widoczne w panelu."""

    __tablename__ = "audit_log"
    __table_args__ = (Index("ix_audit_log_occurred_at", "occurred_at"),)

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    occurred_at: Mapped[datetime] = _now()
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sessions.id", ondelete="SET NULL")
    )
    actor_ref: Mapped[str | None] = mapped_column(String(64))
    """Pseudonim użytkownika albo nazwa usługi."""
    action: Mapped[str] = mapped_column(String(64))
    tool: Mapped[str | None] = mapped_column(String(128))
    outcome: Mapped[AuditOutcome] = mapped_column(_enum(AuditOutcome, "audit_outcome"))
    details: Mapped[dict[str, Any] | None] = mapped_column(JSONB)


class AnalyticsEvent(Base):
    """Pytania z poziomów 2–3 dla panelu – kandydaci do listy poziomu 1 (§2)."""

    __tablename__ = "analytics_events"
    __table_args__ = (Index("ix_analytics_events_occurred_at", "occurred_at"),)

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    occurred_at: Mapped[datetime] = _now()
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sessions.id", ondelete="SET NULL")
    )
    level: Mapped[int] = mapped_column(SmallInteger)
    event_type: Mapped[str] = mapped_column(String(64))
    intent_id: Mapped[str | None] = mapped_column(String(64))
    verdict: Mapped[str | None] = mapped_column(String(16))
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB)


class Escalation(Base):
    """Paczka dla urzędnika (§8.2) – wychodzi dopiero po akceptacji użytkownika."""

    __tablename__ = "escalations"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sessions.id", ondelete="SET NULL"), index=True
    )
    status: Mapped[EscalationStatus] = mapped_column(
        _enum(EscalationStatus, "escalation_status"), default=EscalationStatus.DRAFT
    )
    channel: Mapped[EscalationChannel] = mapped_column(
        _enum(EscalationChannel, "escalation_channel")
    )
    summary: Mapped[str] = mapped_column(Text)
    package: Mapped[dict[str, Any]] = mapped_column(JSONB)
    external_case_id: Mapped[str | None] = mapped_column(String(64))
    """Numer sprawy z (symulowanego) PUE po wysłaniu."""
    created_at: Mapped[datetime] = _now()
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ChunkKind(StrEnum):
    LAW = "LAW"
    GUIDE = "GUIDE"


class KnowledgeChunk(Base):
    """Fragment bazy wiedzy z embeddingiem (RAG, ZUS-35). Zapis i odczyt: ``assistant.rag``.

    Klucz to (fragment, model embeddingów) – zmiana modelu nie miesza wektorów różnych wymiarów.
    """

    __tablename__ = "knowledge_chunks"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    embedding_model: Mapped[str] = mapped_column(String(128), primary_key=True)
    kind: Mapped[ChunkKind] = mapped_column(_enum(ChunkKind, "chunk_kind"))
    title: Mapped[str] = mapped_column(Text)
    text: Mapped[str] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text)
    act: Mapped[str | None] = mapped_column(String(128))
    article: Mapped[str | None] = mapped_column(String(64))
    to_verify: Mapped[bool] = mapped_column(Boolean, default=False)
    content_hash: Mapped[str] = mapped_column(String(64))
    embedding: Mapped[list[float]] = mapped_column(Vector())
