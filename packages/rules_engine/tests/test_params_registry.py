"""Wybór zestawu parametrów po dacie zdarzenia (TE-01, TE-02)."""

from dataclasses import replace
from datetime import date

import pytest
from pydantic import TypeAdapter

from contracts.types import EngineVersion
from rules_engine.params import (
    PARAM_SETS,
    NoParamsForDateError,
    ParamSet,
    current_params,
    get_by_version,
    get_params,
    v2023_04_26,
    v2025_03_19,
    validate_chain,
)

# --- TE-01: wybór zestawu ---------------------------------------------------------------


@pytest.mark.parametrize(
    ("event_date", "expected_version"),
    [
        (date(2023, 4, 26), "params-2023-04-26"),  # pierwszy dzień pierwszego zestawu
        (date(2024, 7, 1), "params-2023-04-26"),
        (date(2025, 3, 18), "params-2023-04-26"),  # ostatni dzień przed zmianą
        (date(2025, 3, 19), "params-2025-03-19"),  # dzień wejścia w życie urlopu uzupełniającego
        (date(2026, 11, 21), "params-2025-03-19"),
        (date(2040, 1, 1), "params-2025-03-19"),  # zestaw otwarty obowiązuje dalej
    ],
)
def test_get_params_selects_set_valid_on_event_date(
    event_date: date, expected_version: str
) -> None:
    assert get_params(event_date).version_id == expected_version


def test_event_before_first_set_raises() -> None:
    with pytest.raises(NoParamsForDateError, match="od 2023-04-26") as exc:
        get_params(date(2023, 4, 25))
    assert exc.value.event_date == date(2023, 4, 25)
    assert exc.value.earliest == date(2023, 4, 26)


def test_current_params_is_last_open_set() -> None:
    assert current_params() is v2025_03_19.PARAMS
    assert current_params().valid_to is None


def test_get_by_version_returns_set_for_engine_version() -> None:
    assert get_by_version("params-2023-04-26") is v2023_04_26.PARAMS
    with pytest.raises(KeyError, match="params-2020-01-01"):
        get_by_version("params-2020-01-01")


@pytest.mark.parametrize("param_set", PARAM_SETS, ids=lambda s: s.version_id)
def test_version_id_is_valid_engine_version_in_contract(param_set: ParamSet) -> None:
    """Kryterium ZUS-10: engineVersion w karcie = version_id zestawu."""
    assert TypeAdapter(EngineVersion).validate_python(param_set.version_id) == param_set.version_id


# --- TE-02: ciągłość zestawów -----------------------------------------------------------


def test_registered_param_sets_have_no_gaps_or_overlaps() -> None:
    validate_chain(PARAM_SETS)  # nie rzuca wyjątku
    assert [s.version_id for s in PARAM_SETS] == ["params-2023-04-26", "params-2025-03-19"]


BASE = v2023_04_26.PARAMS


@pytest.mark.parametrize(
    ("sets", "message"),
    [
        ([], "pusty"),
        (
            [BASE, replace(BASE, valid_from=date(2025, 3, 21), valid_to=None)],
            "luka",
        ),
        (
            [BASE, replace(BASE, valid_from=date(2025, 3, 1), valid_to=None)],
            "nakładanie",
        ),
        (
            [replace(BASE, valid_to=None), v2025_03_19.PARAMS],
            "tylko ostatni",
        ),
        ([BASE], "musi być otwarty"),
    ],
    ids=["empty", "gap", "overlap", "open_set_in_the_middle", "last_set_closed"],
)
def test_validate_chain_rejects_broken_registry(sets: list[ParamSet], message: str) -> None:
    with pytest.raises(ValueError, match=message):
        validate_chain(sets)


def test_set_with_end_before_start_is_rejected() -> None:
    with pytest.raises(ValueError, match="valid_to przed valid_from"):
        replace(BASE, valid_to=date(2020, 1, 1))
