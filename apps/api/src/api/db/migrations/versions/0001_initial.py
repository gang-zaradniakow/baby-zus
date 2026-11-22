"""Tabele startowe: sessions, messages, audit_log, analytics_events, escalations (ZUS-40).

Revision ID: 0001
Revises:
Create Date: 2026-11-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _enum(name: str, *values: str) -> sa.Enum:
    return sa.Enum(*values, name=name, native_enum=False, create_constraint=True, length=32)


def _ts(name: str, *, nullable: bool = False, now: bool = False) -> sa.Column[object]:
    return sa.Column(
        name,
        sa.DateTime(timezone=True),
        nullable=nullable,
        server_default=sa.func.now() if now else None,
    )


def _session_fk(ondelete: str) -> sa.Column[object]:
    return sa.Column(
        "session_id",
        sa.Uuid(),
        sa.ForeignKey("sessions.id", ondelete=ondelete),
        nullable=ondelete == "SET NULL",
    )


def upgrade() -> None:
    # pgvector dla RAG (ZUS-35); w compose tworzy je też skrypt init bazy.
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("user_ref", sa.String(64), nullable=False, index=True),
        sa.Column("auth_mode", _enum("auth_mode", "MOBYWATEL", "ANONYMOUS"), nullable=False),
        sa.Column("profile", postgresql.JSONB(), nullable=True),
        _ts("created_at", now=True),
        _ts("expires_at"),
        _ts("revoked_at", nullable=True),
    )
    op.create_table(
        "messages",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        _session_fk("CASCADE"),
        sa.Column("seq", sa.Integer(), nullable=False),
        sa.Column("role", _enum("message_role", "USER", "ASSISTANT"), nullable=False),
        sa.Column("level", sa.SmallInteger(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("intent_id", sa.String(64), nullable=True),
        sa.Column("card", postgresql.JSONB(), nullable=True),
        _ts("created_at", now=True),
        sa.UniqueConstraint("session_id", "seq", name="session_seq"),
    )
    op.create_table(
        "audit_log",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        _ts("occurred_at", now=True),
        _session_fk("SET NULL"),
        sa.Column("actor_ref", sa.String(64), nullable=True),
        sa.Column("action", sa.String(64), nullable=False),
        sa.Column("tool", sa.String(128), nullable=True),
        sa.Column("outcome", _enum("audit_outcome", "OK", "ERROR"), nullable=False),
        sa.Column("details", postgresql.JSONB(), nullable=True),
    )
    op.create_index("ix_audit_log_occurred_at", "audit_log", ["occurred_at"])
    op.create_table(
        "analytics_events",
        sa.Column("id", sa.BigInteger(), sa.Identity(), primary_key=True),
        _ts("occurred_at", now=True),
        _session_fk("SET NULL"),
        sa.Column("level", sa.SmallInteger(), nullable=False),
        sa.Column("event_type", sa.String(64), nullable=False),
        sa.Column("intent_id", sa.String(64), nullable=True),
        sa.Column("verdict", sa.String(16), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
    )
    op.create_index("ix_analytics_events_occurred_at", "analytics_events", ["occurred_at"])
    op.create_table(
        "escalations",
        sa.Column("id", sa.Uuid(), primary_key=True),
        _session_fk("SET NULL"),
        sa.Column(
            "status",
            _enum("escalation_status", "DRAFT", "CONFIRMED", "SENT"),
            nullable=False,
        ),
        sa.Column(
            "channel",
            _enum("escalation_channel", "PUE_MESSAGE", "EVISIT", "BRANCH_VISIT"),
            nullable=False,
        ),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("package", postgresql.JSONB(), nullable=False),
        sa.Column("external_case_id", sa.String(64), nullable=True),
        _ts("created_at", now=True),
        _ts("confirmed_at", nullable=True),
    )
    op.create_index("ix_escalations_session_id", "escalations", ["session_id"])


def downgrade() -> None:
    op.drop_table("escalations")
    op.drop_table("analytics_events")
    op.drop_table("audit_log")
    op.drop_table("messages")
    op.drop_table("sessions")
