"""Repozytorium sesji: te same testy dla wersji w pamięci i SQL (Postgres, integration)."""

import uuid
from collections.abc import AsyncIterator
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.exc import IntegrityError

from api.db import migrate
from api.db.engine import create_engine, create_sessionmaker
from api.db.models import AuthMode
from api.db.session_repository import SqlSessionRepository
from api.services.sessions import (
    InMemorySessionRepository,
    SessionRecord,
    SessionRepository,
    hash_token,
    new_token,
)

NOW = datetime(2026, 11, 22, 9, 0, tzinfo=UTC)


@pytest.fixture(params=["memory", pytest.param("sql", marks=pytest.mark.integration)])
async def repository(request: pytest.FixtureRequest) -> AsyncIterator[SessionRepository]:
    if request.param == "memory":
        yield InMemorySessionRepository()
        return
    url: str = request.getfixturevalue("pg_url")
    migrate.upgrade(url)
    engine = create_engine(url)
    yield SqlSessionRepository(create_sessionmaker(engine))
    await engine.dispose()


async def create(repository: SessionRepository, **overrides: object) -> SessionRecord:
    data: dict[str, object] = {
        "token_hash": hash_token(new_token()),
        "user_ref": "persona-t01",
        "auth_mode": AuthMode.MOBYWATEL,
        "profile": None,
        "created_at": NOW,
        "expires_at": NOW + timedelta(hours=1),
    }
    data.update(overrides)
    return await repository.create(**data)  # type: ignore[arg-type]


async def test_create_and_find_by_token_hash(repository: SessionRepository) -> None:
    token_hash = hash_token(new_token())
    profile = {"profileId": "anon-1", "child": {"source": "USER"}}
    created = await create(
        repository, token_hash=token_hash, auth_mode=AuthMode.ANONYMOUS, profile=profile
    )
    found = await repository.get_by_token_hash(token_hash)
    assert found == created
    assert found is not None
    assert found.auth_mode is AuthMode.ANONYMOUS
    assert found.profile == profile


async def test_unknown_token_hash(repository: SessionRepository) -> None:
    assert await repository.get_by_token_hash(hash_token("nieznany")) is None


async def test_duplicate_token_hash_is_rejected(repository: SessionRepository) -> None:
    token_hash = hash_token(new_token())
    await create(repository, token_hash=token_hash)
    with pytest.raises((ValueError, IntegrityError)):  # pamięć | SQL
        await create(repository, token_hash=token_hash)


async def test_revoke_only_once_and_only_target(repository: SessionRepository) -> None:
    first_hash, second_hash = hash_token(new_token()), hash_token(new_token())
    first = await create(repository, token_hash=first_hash)
    await create(repository, token_hash=second_hash)

    await repository.revoke(first.id, NOW + timedelta(minutes=5))
    await repository.revoke(first.id, NOW + timedelta(minutes=9))  # drugi raz nic nie zmienia
    await repository.revoke(uuid.uuid4(), NOW)  # nieznana sesja – bez błędu

    revoked = await repository.get_by_token_hash(first_hash)
    assert revoked is not None
    assert revoked.revoked_at == NOW + timedelta(minutes=5)
    assert not revoked.is_active(NOW)
    other = await repository.get_by_token_hash(second_hash)
    assert other is not None
    assert other.is_active(NOW)


async def test_update_profile(repository: SessionRepository) -> None:
    token_hash = hash_token(new_token())
    created = await create(repository, token_hash=token_hash)
    await create(repository)  # inna sesja bez zmian
    profile = {"profileId": "persona-t01", "child": {"source": "USER"}}
    await repository.update_profile(created.id, profile)
    found = await repository.get_by_token_hash(token_hash)
    assert found is not None
    assert found.profile == profile


def test_session_activity_window() -> None:
    record = SessionRecord(
        id=uuid.uuid4(),
        user_ref="u",
        auth_mode=AuthMode.MOBYWATEL,
        profile=None,
        created_at=NOW,
        expires_at=NOW + timedelta(minutes=30),
    )
    assert record.is_active(NOW + timedelta(minutes=29, seconds=59))
    assert not record.is_active(NOW + timedelta(minutes=30))


def test_tokens_are_random_and_hash_is_sha256() -> None:
    assert new_token() != new_token()
    assert len(hash_token("x")) == 64
    assert hash_token("x") == hash_token("x")
