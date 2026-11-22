"""Baza wiedzy RAG: tabela knowledge_chunks z kolumną vector (ZUS-35).

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-22
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

from api.db.types import Vector

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Rozszerzenie vector tworzy migracja 0001.
    op.create_table(
        "knowledge_chunks",
        sa.Column("id", sa.String(128), primary_key=True),
        sa.Column("embedding_model", sa.String(128), primary_key=True),
        sa.Column(
            "kind",
            sa.Enum(
                "LAW",
                "GUIDE",
                name="chunk_kind",
                native_enum=False,
                create_constraint=True,
                length=32,
            ),
            nullable=False,
        ),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("act", sa.String(128), nullable=True),
        sa.Column("article", sa.String(64), nullable=True),
        sa.Column("to_verify", sa.Boolean(), nullable=False),
        sa.Column("content_hash", sa.String(64), nullable=False),
        sa.Column("embedding", Vector(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("knowledge_chunks")
