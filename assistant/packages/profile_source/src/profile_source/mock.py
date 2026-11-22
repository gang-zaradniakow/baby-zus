"""Adapter mock: profile z pamięci albo z person ``data/personas`` (demo, testy, MCP)."""

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Self
from zoneinfo import ZoneInfo

from contracts import ParentProfile, Profile, StageInfo
from profile_source.errors import ConsentRequiredError, ProfileNotFoundError
from profile_source.personas import load_personas
from rules_engine.catalog import detect_stage

WARSAW = ZoneInfo("Europe/Warsaw")

Clock = Callable[[], date]


def warsaw_today() -> date:
    """Dzisiejsza data w Polsce – domyślny zegar mocka (logika nie woła ``date.today()``)."""
    return datetime.now(WARSAW).date()


@dataclass(frozen=True, slots=True)
class MockEntry:
    profile: Profile
    today: date | None = None
    """Stały „dziś” dla etapu (persony); ``None`` – zegar źródła."""


class MockProfileSource:
    """Implementacja portu na danych w pamięci; etap liczy silnik reguł."""

    def __init__(
        self, entries: Mapping[str, Profile | MockEntry], *, clock: Clock = warsaw_today
    ) -> None:
        self._entries = {
            ref: entry if isinstance(entry, MockEntry) else MockEntry(entry)
            for ref, entry in entries.items()
        }
        self._clock = clock

    @classmethod
    def from_personas(cls, directory: Path, *, clock: Clock = warsaw_today) -> Self:
        """Klucz = ``profileId`` persony (np. ``persona-t01``), „dziś” = ``today`` persony."""
        entries = {
            persona.profile.profile_id: MockEntry(persona.profile, persona.today)
            for persona in load_personas(directory)
        }
        return cls(entries, clock=clock)

    @property
    def user_refs(self) -> list[str]:
        return sorted(self._entries)

    # --- metody synchroniczne (atrapa backendu HTTP w testach) ---------------------------

    def _entry(self, user_ref: str) -> MockEntry:
        try:
            return self._entries[user_ref]
        except KeyError:
            raise ProfileNotFoundError(user_ref) from None

    def profile(self, user_ref: str) -> Profile:
        return self._entry(user_ref).profile

    def partner(self, user_ref: str) -> ParentProfile:
        profile = self.profile(user_ref)
        if not profile.partner_consent:
            raise ConsentRequiredError(user_ref)
        if profile.partner is None:
            raise ProfileNotFoundError(f"{user_ref}/partner")
        return profile.partner

    def stage(self, user_ref: str) -> StageInfo:
        entry = self._entry(user_ref)
        return detect_stage(entry.profile, entry.today or self._clock()).to_contract()

    # --- port ----------------------------------------------------------------------------

    async def get_profile(self, user_ref: str) -> Profile:
        return self.profile(user_ref)

    async def get_partner_profile(self, user_ref: str) -> ParentProfile:
        return self.partner(user_ref)

    async def get_child_stage(self, user_ref: str) -> StageInfo:
        return self.stage(user_ref)

    async def aclose(self) -> None:
        return None
