"""Wykrywanie etapu i flag (TE-05…TE-07)."""

from datetime import date, timedelta
from typing import Any

import pytest

from contracts import Flag, Profile, Stage
from rules_engine.catalog import detect_stage

TODAY = date(2026, 11, 21)


def profile(
    child: dict[str, Any] | None = None, events: list[dict[str, Any]] | None = None
) -> Profile:
    return Profile.model_validate(
        {
            "profileId": "p-test",
            "applicant": {"role": "MOTHER", "insurance": {"source": "USER"}},
            "child": {"source": "USER", **(child or {})},
            "specialEvents": events or [],
        }
    )


def days(n: int) -> str:
    return (TODAY + timedelta(days=n)).isoformat()


# --- TE-05: etapy E0–E3 -----------------------------------------------------------------


@pytest.mark.parametrize(
    ("child", "expected"),
    [
        ({"expectedBirthDate": days(43)}, Stage.E0),  # ponad 6 tygodni do porodu
        ({"expectedBirthDate": days(42)}, Stage.E1),  # dokładnie 6 tygodni
        ({"expectedBirthDate": days(0)}, Stage.E1),
        ({"expectedBirthDate": days(-3)}, Stage.E1),  # po terminie, jeszcze bez porodu
        ({"birthDate": days(0)}, Stage.E2),  # dzień porodu
        ({"birthDate": days(-139)}, Stage.E2),  # ostatni dzień 20 tygodni
        ({"birthDate": days(-140)}, Stage.E3),  # pierwszy dzień po urlopie macierzyńskim
        ({"birthDate": days(-140), "childrenCount": 2}, Stage.E2),  # bliźnięta: 31 tygodni
        ({"birthDate": days(-217), "childrenCount": 2}, Stage.E3),
        ({"birthDate": "2022-05-01"}, Stage.E3),  # sprzed zakresu parametrów
        ({"birthDate": days(-10), "expectedBirthDate": days(5)}, Stage.E2),  # poród wygrywa z PDP
    ],
    ids=[
        "pregnancy",
        "six_weeks_before",
        "due_date",
        "overdue",
        "birth_day",
        "last_day_of_maternity",
        "after_maternity",
        "twins_still_maternity",
        "twins_after_maternity",
        "birth_before_params",
        "birth_beats_expected_date",
    ],
)
def test_detect_stage(child: dict[str, Any], expected: Stage) -> None:
    result = detect_stage(profile(child), TODAY)
    assert result.stage is expected
    assert result.flags == ()
    assert result.missing == ()


# --- TE-06: flagi nakładane na etap ------------------------------------------------------


def test_adoption_sets_flag_and_counts_from_placement() -> None:
    child = {
        "placement": {
            "kind": "ADOPTION",
            "childBirthDate": "2017-06-01",
            "placementDate": days(-30),
        }
    }
    result = detect_stage(profile(child), TODAY)
    assert result.stage is Stage.E2
    assert result.flags == (Flag.ADOPTION,)


def test_planned_placement_is_treated_like_expected_birth() -> None:
    child = {
        "placement": {
            "kind": "FOSTER_FAMILY",
            "childBirthDate": "2024-01-10",
            "placementDate": days(60),
        }
    }
    result = detect_stage(profile(child), TODAY)
    assert result.stage is Stage.E0
    assert result.flags == (Flag.ADOPTION,)


@pytest.mark.parametrize(
    ("child", "events", "expected_stage"),
    [
        ({}, [{"kind": "STILLBIRTH", "dateFrom": days(-10)}], Stage.E2),
        ({}, [{"kind": "STILLBIRTH", "dateFrom": days(-56)}], Stage.E3),  # po 8 tygodniach
        ({}, [{"kind": "MISCARRIAGE", "dateFrom": days(-3)}], Stage.E2),
        ({"birthDate": days(-10)}, [{"kind": "STILLBIRTH", "dateFrom": days(-10)}], Stage.E2),
        ({"birthDate": days(-30)}, [{"kind": "CHILD_DEATH", "dateFrom": days(-25)}], Stage.E2),
        # zgon 5. dnia życia: urlop kończy się po 8 tygodniach od porodu
        ({"birthDate": days(-57)}, [{"kind": "CHILD_DEATH", "dateFrom": days(-52)}], Stage.E3),
        # zgon w 7. tygodniu: co najmniej 7 dni od zgonu przedłuża urlop ponad 8 tygodni
        ({"birthDate": days(-58)}, [{"kind": "CHILD_DEATH", "dateFrom": days(-6)}], Stage.E2),
        # zgon po 8. tygodniu życia: urlop kończy się 7 dni po zgonie
        ({"birthDate": days(-100)}, [{"kind": "CHILD_DEATH", "dateFrom": days(-10)}], Stage.E3),
        ({"birthDate": days(-100)}, [{"kind": "CHILD_DEATH", "dateFrom": days(-3)}], Stage.E2),
        ({"expectedBirthDate": days(60), "zaZyciem": True}, [], Stage.E0),
    ],
    ids=[
        "stillbirth",
        "stillbirth_after_8_weeks",
        "miscarriage",
        "stillbirth_with_birth_date",
        "child_death",
        "child_death_leave_ended",
        "child_death_min_7_days",
        "late_child_death_leave_ended",
        "late_child_death_7_days",
        "za_zyciem",
    ],
)
def test_difficult_situations_set_flag(
    child: dict[str, Any], events: list[dict[str, Any]], expected_stage: Stage
) -> None:
    result = detect_stage(profile(child, events), TODAY)
    assert result.stage is expected_stage
    assert Flag.DIFFICULT in result.flags


def test_premature_birth_is_special_but_not_difficult() -> None:
    result = detect_stage(
        profile({"birthDate": days(-5)}, [{"kind": "PREMATURE_BIRTH", "dateFrom": days(-5)}]),
        TODAY,
    )
    assert result.stage is Stage.E2
    assert result.flags == ()


# --- TE-07: brak danych ------------------------------------------------------------------


def test_detect_stage_without_dates_needs_info() -> None:
    result = detect_stage(profile(), TODAY)
    assert result.stage is None
    assert result.missing == ("child.expectedBirthDate",)


def test_stage_result_converts_to_contract() -> None:
    info = detect_stage(
        profile({}, [{"kind": "STILLBIRTH", "dateFrom": days(-1)}]), TODAY
    ).to_contract()
    assert info.stage is Stage.E2
    assert info.flags == [Flag.DIFFICULT]
