"""Logowanie symulowane (mObywatel) i tryb bez logowania (formularz) – ZUS-41.

Oba tryby kończą się tym samym: tokenem sesji i profilem typu ``Profile``
(``GET /me/profile``). Różni się tylko źródło danych: ZUS (ProfileSource) albo USER.
"""

import uuid
from datetime import datetime, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, status
from pydantic import Field

from api.auth.forms import ProfileForm
from api.db.models import AuthMode
from api.deps import (
    Clock,
    CurrentSession,
    get_clock,
    get_profile_source,
    get_sessions,
    get_settings,
)
from api.errors import ErrorResponse
from api.services.sessions import SessionRepository, hash_token, new_token
from api.settings import Settings
from contracts._base import ContractModel
from profile_source import ProfileSource

router = APIRouter(prefix="/auth", tags=["auth"])

ANONYMOUS_PREFIX = "anon-"


class MobywatelLogin(ContractModel):
    """Symulacja: w prawdziwym mObywatelu pseudonim przyszedłby z dostawcy tożsamości."""

    user_ref: str = Field(min_length=1, max_length=64, examples=["persona-t01"])


class SessionToken(ContractModel):
    token: str
    token_type: str = "Bearer"  # noqa: S105 – typ tokenu, nie hasło
    expires_at: datetime
    auth_mode: AuthMode


async def _open_session(
    sessions: SessionRepository,
    settings: Settings,
    clock: Clock,
    *,
    user_ref: str,
    auth_mode: AuthMode,
    profile: dict[str, Any] | None,
) -> SessionToken:
    token = new_token()
    now = clock()
    expires_at = now + timedelta(minutes=settings.session_ttl_minutes)
    await sessions.create(
        token_hash=hash_token(token),
        user_ref=user_ref,
        auth_mode=auth_mode,
        profile=profile,
        created_at=now,
        expires_at=expires_at,
    )
    return SessionToken(token=token, expires_at=expires_at, auth_mode=auth_mode)


Sessions = Annotated[SessionRepository, Depends(get_sessions)]
AppSettings = Annotated[Settings, Depends(get_settings)]
AppClock = Annotated[Clock, Depends(get_clock)]


@router.post(
    "/mobywatel",
    status_code=status.HTTP_201_CREATED,
    responses={404: {"model": ErrorResponse}, 503: {"model": ErrorResponse}},
)
async def login_mobywatel(
    body: MobywatelLogin,
    sessions: Sessions,
    settings: AppSettings,
    clock: AppClock,
    source: Annotated[ProfileSource, Depends(get_profile_source)],
) -> SessionToken:
    """Symulowane logowanie: profil musi istnieć w źródle profilu (persony w trybie mock)."""
    await source.get_profile(body.user_ref)
    return await _open_session(
        sessions,
        settings,
        clock,
        user_ref=body.user_ref,
        auth_mode=AuthMode.MOBYWATEL,
        profile=None,
    )


@router.post("/anonymous", status_code=status.HTTP_201_CREATED)
async def login_anonymous(
    form: ProfileForm, sessions: Sessions, settings: AppSettings, clock: AppClock
) -> SessionToken:
    """Tryb bez logowania: profil z formularza, wszystkie dane ze źródłem USER."""
    user_ref = f"{ANONYMOUS_PREFIX}{uuid.uuid4().hex[:16]}"
    profile = form.to_profile(user_ref)
    return await _open_session(
        sessions,
        settings,
        clock,
        user_ref=user_ref,
        auth_mode=AuthMode.ANONYMOUS,
        profile=profile.model_dump(mode="json"),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(session: CurrentSession, sessions: Sessions, clock: AppClock) -> None:
    await sessions.revoke(session.id, clock())
