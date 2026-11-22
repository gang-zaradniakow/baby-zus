"""Sesje użytkownika: tokeny, rekord sesji i port repozytorium (ZUS-41).

Token widzi tylko klient; w magazynie leży jego skrót SHA-256, więc wyciek bazy nie daje
dostępu do sesji. Repozytorium ma dwie implementacje: SQL (``api.db.session_repository``,
produkcja i testy integracyjne) oraz w pamięci (testy jednostkowe API bez Dockera).
"""

import hashlib
import secrets
import uuid
from dataclasses import dataclass, replace
from datetime import datetime
from typing import Any, Protocol

from api.db.models import AuthMode

TOKEN_BYTES = 32


def new_token() -> str:
    return secrets.token_urlsafe(TOKEN_BYTES)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@dataclass(frozen=True, slots=True)
class SessionRecord:
    id: uuid.UUID
    user_ref: str
    """Pseudonim: ``profileId`` z ProfileSource albo ``anon-…`` w trybie bez logowania."""
    auth_mode: AuthMode
    profile: dict[str, Any] | None
    """Profil sesji (JSON ``Profile``): z formularza albo po uzupełnieniu braków;
    ``None`` – profil pobierany na bieżąco z ProfileSource (mObywatel)."""
    created_at: datetime
    expires_at: datetime
    revoked_at: datetime | None = None

    def is_active(self, now: datetime) -> bool:
        return self.revoked_at is None and now < self.expires_at


class SessionRepository(Protocol):
    async def create(
        self,
        *,
        token_hash: str,
        user_ref: str,
        auth_mode: AuthMode,
        profile: dict[str, Any] | None,
        created_at: datetime,
        expires_at: datetime,
    ) -> SessionRecord: ...

    async def get_by_token_hash(self, token_hash: str) -> SessionRecord | None: ...

    async def revoke(self, session_id: uuid.UUID, at: datetime) -> None: ...

    async def update_profile(self, session_id: uuid.UUID, profile: dict[str, Any]) -> None:
        """Zapisz profil sesji po uzupełnieniu braków (PATCH /me/profile, ZUS-42)."""
        ...


class InMemorySessionRepository:
    """Implementacja w pamięci – zachowanie jak SQL (wspólne testy kontraktowe)."""

    def __init__(self) -> None:
        self._by_hash: dict[str, SessionRecord] = {}

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
        if token_hash in self._by_hash:
            raise ValueError("token_hash musi być unikalny")
        record = SessionRecord(
            id=uuid.uuid4(),
            user_ref=user_ref,
            auth_mode=auth_mode,
            profile=profile,
            created_at=created_at,
            expires_at=expires_at,
        )
        self._by_hash[token_hash] = record
        return record

    async def get_by_token_hash(self, token_hash: str) -> SessionRecord | None:
        return self._by_hash.get(token_hash)

    async def revoke(self, session_id: uuid.UUID, at: datetime) -> None:
        for token_hash, record in self._by_hash.items():
            if record.id == session_id and record.revoked_at is None:
                self._by_hash[token_hash] = replace(record, revoked_at=at)

    async def update_profile(self, session_id: uuid.UUID, profile: dict[str, Any]) -> None:
        for token_hash, record in self._by_hash.items():
            if record.id == session_id:
                self._by_hash[token_hash] = replace(record, profile=profile)
