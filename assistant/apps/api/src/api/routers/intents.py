"""Katalog pytań poziomu 1 (ZUS-42): lista dla etapu i flag albo wyszukiwanie."""

from typing import Annotated

from fastapi import APIRouter, Query

from contracts import Flag, Intent, Stage, StageInfo
from rules_engine.catalog import featured_intents, search_intents

router = APIRouter(prefix="/intents", tags=["intents"])


@router.get("")
async def list_intents(
    stage: Annotated[Stage | None, Query(description="E0–E3; brak – lista ogólna")] = None,
    flags: Annotated[list[Flag] | None, Query(description="ADOPTION, DIFFICULT")] = None,
    q: Annotated[
        str | None, Query(min_length=2, max_length=200, description="wyszukiwanie w katalogu")
    ] = None,
) -> list[Intent]:
    """5–8 pytań dla etapu (kolejność ustala silnik), a z ``q`` – wyniki wyszukiwania."""
    if q is not None:
        return search_intents(q)
    unique_flags = list(dict.fromkeys(flags or []))
    return featured_intents(StageInfo(stage=stage, flags=unique_flags))
