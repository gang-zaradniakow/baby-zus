"""Zasoby bieżącego użytkownika: profil, etap i uzupełnianie braków (ZUS-41, ZUS-42)."""

from fastapi import APIRouter

from api.deps import CurrentProfile, CurrentSession, Sessions, Source, Today
from api.errors import ErrorResponse
from api.services.profile_patch import ProfilePatch, save_patch
from contracts import Profile, StageInfo
from rules_engine.catalog import detect_stage

router = APIRouter(prefix="/me", tags=["me"], responses={401: {"model": ErrorResponse}})


@router.get("/profile")
async def get_my_profile(profile: CurrentProfile) -> Profile:
    """Profil sesji – ten sam kontrakt w obu trybach logowania."""
    return profile


@router.patch("/profile", responses={422: {"model": ErrorResponse}})
async def patch_my_profile(
    patch: ProfilePatch,
    session: CurrentSession,
    profile: CurrentProfile,
    sessions: Sessions,
) -> Profile:
    """Uzupełnij brakujące dane (pola z ``missing`` karty NEED_INFO); źródło: USER."""
    return await save_patch(sessions, session, profile, patch)


@router.get("/stage")
async def get_my_stage(session: CurrentSession, source: Source, today: Today) -> StageInfo:
    """Etap E0–E3 i flagi: od backendu profilu albo z profilu sesji (formularz, uzupełnienia)."""
    if session.profile is None:
        return await source.get_child_stage(session.user_ref)
    profile = Profile.model_validate(session.profile)
    return detect_stage(profile, today).to_contract()
