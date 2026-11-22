"""Rejestr zestawów parametrów i wybór zestawu obowiązującego w dniu zdarzenia."""

from collections.abc import Sequence
from datetime import date, timedelta
from itertools import pairwise
from typing import Final

from rules_engine.params import v2023_04_26, v2025_03_19
from rules_engine.params.base import ParamSet


class NoParamsForDateError(LookupError):
    """Zdarzenie sprzed pierwszego zestawu – sprawa poza zakresem silnika (eskalacja)."""

    def __init__(self, event_date: date, earliest: date) -> None:
        super().__init__(
            f"brak parametrów dla {event_date.isoformat()} – silnik obsługuje zdarzenia "
            f"od {earliest.isoformat()}"
        )
        self.event_date = event_date
        self.earliest = earliest


def validate_chain(sets: Sequence[ParamSet]) -> None:
    """Sprawdza, że zestawy są uporządkowane, bez luk i nakładania, a tylko ostatni jest otwarty."""
    if not sets:
        raise ValueError("rejestr parametrów jest pusty")
    for current, following in pairwise(sets):
        if current.valid_to is None:
            raise ValueError(f"{current.version_id}: tylko ostatni zestaw może nie mieć valid_to")
        expected = current.valid_to + timedelta(days=1)
        if following.valid_from != expected:
            kind = "luka" if following.valid_from > expected else "nakładanie"
            raise ValueError(
                f"{kind} między {current.version_id} a {following.version_id}: "
                f"po {current.valid_to.isoformat()} następny zestaw powinien zaczynać się "
                f"{expected.isoformat()}"
            )
    if sets[-1].valid_to is not None:
        raise ValueError(f"{sets[-1].version_id}: ostatni zestaw musi być otwarty (valid_to=None)")


#: Wszystkie zestawy od najstarszego. Nowy zestaw dopisz na końcu.
PARAM_SETS: Final[tuple[ParamSet, ...]] = (v2023_04_26.PARAMS, v2025_03_19.PARAMS)
validate_chain(PARAM_SETS)  # błąd w rejestrze ujawnia się już przy imporcie


def get_params(event_date: date) -> ParamSet:
    """Zestaw obowiązujący w dniu zdarzenia (porodu, przyjęcia dziecka, niezdolności)."""
    for param_set in PARAM_SETS:
        if param_set.covers(event_date):
            return param_set
    raise NoParamsForDateError(event_date, PARAM_SETS[0].valid_from)


def current_params() -> ParamSet:
    """Zestaw aktualny (otwarty)."""
    return PARAM_SETS[-1]


def get_by_version(version_id: str) -> ParamSet:
    """Zestaw po identyfikatorze z ``AnswerCard.engine_version`` (np. przy odwołaniu)."""
    for param_set in PARAM_SETS:
        if param_set.version_id == version_id:
            return param_set
    raise KeyError(f"nieznana wersja parametrów: {version_id}")
