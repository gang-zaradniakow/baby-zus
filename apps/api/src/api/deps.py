"""Zależności FastAPI: zegar, repozytorium sesji, źródło profilu, bieżąca sesja i profil.

Usługi żyją w ``app.state`` (ustawia je ``create_app``), więc testy podmieniają je przez
argumenty fabryki, a nie przez łatanie modułów.
"""

from collections.abc import Callable
from datetime import UTC, date, datetime
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api.errors import ApiError
from api.services.sessions import SessionRecord, SessionRepository, hash_token
from api.settings import Settings
from contracts import Profile
from profile_source import ProfileSource

Clock = Callable[[], datetime]
WARSAW = ZoneInfo("Europe/Warsaw")

bearer = HTTPBearer(auto_error=False, description="Token sesji z /auth/*")


def utc_now() -> datetime:
    return datetime.now(UTC)


def get_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


def get_clock(request: Request) -> Clock:
    clock: Clock = request.app.state.clock
    return clock


def get_today(clock: Annotated[Clock, Depends(get_clock)]) -> date:
    """„Dziś” dla silnika reguł – data w Polsce według zegara aplikacji."""
    return clock().astimezone(WARSAW).date()


def get_sessions(request: Request) -> SessionRepository:
    sessions: SessionRepository = request.app.state.sessions
    return sessions


def get_profile_source(request: Request) -> ProfileSource:
    source: ProfileSource = request.app.state.profile_source
    return source


def _unauthorized(code: str, message: str) -> ApiError:
    return ApiError(401, code, message, headers={"WWW-Authenticate": "Bearer"})


async def current_session(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    sessions: Annotated[SessionRepository, Depends(get_sessions)],
    clock: Annotated[Clock, Depends(get_clock)],
) -> SessionRecord:
    """Sesja z nagłówka ``Authorization: Bearer``; brak, nieznany lub wygasły token → 401."""
    if credentials is None:
        raise _unauthorized(
            "UNAUTHORIZED", "Brak tokenu sesji. Zaloguj się albo wypełnij formularz."
        )
    record = await sessions.get_by_token_hash(hash_token(credentials.credentials))
    if record is None:
        raise _unauthorized("INVALID_TOKEN", "Nieznany token sesji.")
    if not record.is_active(clock()):
        raise _unauthorized("SESSION_EXPIRED", "Sesja wygasła. Zaloguj się ponownie.")
    return record


async def current_profile(
    session: Annotated[SessionRecord, Depends(current_session)],
    source: Annotated[ProfileSource, Depends(get_profile_source)],
) -> Profile:
    """Profil sesji: z ProfileSource (mObywatel) albo z formularza (tryb bez logowania)."""
    if session.profile is not None:  # tryb bez logowania (AuthMode.ANONYMOUS)
        return Profile.model_validate(session.profile)
    return await source.get_profile(session.user_ref)


CurrentSession = Annotated[SessionRecord, Depends(current_session)]
CurrentProfile = Annotated[Profile, Depends(current_profile)]
Sessions = Annotated[SessionRepository, Depends(get_sessions)]
Source = Annotated[ProfileSource, Depends(get_profile_source)]
Today = Annotated[date, Depends(get_today)]
