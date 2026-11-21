"""Testy profilu (§3.3) i informacji o etapie."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest
from pydantic import ValidationError

from contracts import FactSource, Flag, InsurancePeriod, Profile, Stage, StageInfo

type JsonDict = dict[str, Any]


def test_profile_example_is_valid(profile_json: JsonDict) -> None:
    profile = Profile.model_validate(profile_json)

    insurance = profile.applicant.insurance
    assert insurance.source is FactSource.ZUS
    assert insurance.deduction_rate == Decimal("0.1371")
    assert len(insurance.salaries) == 12
    assert insurance.sick_leaves[0].code == "B"
    assert profile.partner is not None


def test_incomplete_profile_is_valid() -> None:
    """Brak danych to nie błąd kontraktu – silnik zwróci NEED_INFO (TE-07, TE-22)."""
    profile = Profile.model_validate(
        {
            "profileId": "p-1",
            "applicant": {"role": "MOTHER", "insurance": {"source": "USER"}},
            "child": {"source": "USER"},
        }
    )
    assert profile.child.expected_birth_date is None
    assert profile.child.children_count == 1


def test_partner_data_from_zus_requires_consent(profile_json: JsonDict) -> None:
    profile_json["partner"]["insurance"]["source"] = "ZUS"
    with pytest.raises(ValidationError, match="zgody"):
        Profile.model_validate(profile_json)

    profile_json["partnerConsent"] = True
    assert Profile.model_validate(profile_json).partner_consent


def test_salary_months_must_be_unique(profile_json: JsonDict) -> None:
    salaries = profile_json["applicant"]["insurance"]["salaries"]
    salaries.append(dict(salaries[0]))
    with pytest.raises(ValidationError, match="powtórzone"):
        Profile.model_validate(profile_json)


@pytest.mark.parametrize("month", ["2026-13", "2026-1", "26-01", "2026/01"])
def test_salary_month_format(profile_json: JsonDict, month: str) -> None:
    profile_json["applicant"]["insurance"]["salaries"][0]["month"] = month
    with pytest.raises(ValidationError):
        Profile.model_validate(profile_json)


@pytest.mark.parametrize(("count_date", "ok"), [("2025-11-30", True), ("2025-12-31", False)])
def test_payer_count_date_must_be_30_november(
    profile_json: JsonDict, count_date: str, ok: bool
) -> None:
    profile_json["applicant"]["insurance"]["payer"]["countDate"] = count_date
    if ok:
        Profile.model_validate(profile_json)
    else:
        with pytest.raises(ValidationError, match="30 listopada"):
            Profile.model_validate(profile_json)


def test_insurance_period_end_reason_requires_end_date() -> None:
    with pytest.raises(ValidationError, match="daty końca"):
        InsurancePeriod.model_validate(
            {
                "title": "EMPLOYMENT",
                "sickness": "MANDATORY",
                "dateFrom": "2024-01-01",
                "endReason": "LIQUIDATION",
            }
        )


@pytest.mark.parametrize(
    ("path", "value"),
    [
        (("applicant", "insurance", "periods", 0), {"dateTo": "2020-01-01"}),
        (("applicant", "insurance", "sickLeaves", 0), {"dateTo": "2026-08-01"}),
    ],
    ids=["insurance_period", "sick_leave"],
)
def test_date_ranges_must_be_in_order(
    profile_json: JsonDict, path: tuple[str | int, ...], value: JsonDict
) -> None:
    node: Any = profile_json
    for key in path:
        node = node[key]
    node.update(value)
    with pytest.raises(ValidationError, match="wcześniejsza"):
        Profile.model_validate(profile_json)


@pytest.mark.parametrize("code", ["F", "b", "BB"])
def test_sick_leave_code_is_single_letter_a_to_e(profile_json: JsonDict, code: str) -> None:
    profile_json["applicant"]["insurance"]["sickLeaves"][0]["code"] = code
    with pytest.raises(ValidationError):
        Profile.model_validate(profile_json)


@pytest.mark.parametrize("count", [0, 11])
def test_children_count_range(profile_json: JsonDict, count: int) -> None:
    profile_json["child"]["childrenCount"] = count
    with pytest.raises(ValidationError):
        Profile.model_validate(profile_json)


def test_adoption_placement_is_valid(profile_json: JsonDict) -> None:
    """Scenariusz T10: przysposobienie dziecka 9-letniego."""
    profile_json["child"] = {
        "source": "USER",
        "placement": {
            "kind": "ADOPTION",
            "childBirthDate": "2017-06-01",
            "placementDate": "2026-10-01",
            "rulingFinalDate": "2026-11-02",
        },
    }
    placement = Profile.model_validate(profile_json).child.placement
    assert placement is not None
    assert placement.ruling_final_date is not None


def test_placement_before_child_birth_is_rejected(profile_json: JsonDict) -> None:
    profile_json["child"]["placement"] = {
        "kind": "ADOPTION",
        "childBirthDate": "2020-05-01",
        "placementDate": "2019-01-01",
    }
    with pytest.raises(ValidationError, match="wcześniejsza"):
        Profile.model_validate(profile_json)


def test_leave_plan_work_fraction_range(profile_json: JsonDict) -> None:
    part = {
        "parent": "FATHER",
        "type": "RODZICIELSKI",
        "dateFrom": "2027-04-01",
        "dateTo": "2027-05-31",
        "workFraction": "0.5",
    }
    profile_json["leavePlan"] = [part]
    assert Profile.model_validate(profile_json).leave_plan[0].work_fraction == Decimal("0.5")

    profile_json["leavePlan"] = [{**part, "workFraction": "1.5"}]
    with pytest.raises(ValidationError):
        Profile.model_validate(profile_json)


def test_special_events_are_valid(profile_json: JsonDict) -> None:
    """Scenariusze T7 i T8: martwe urodzenie (zdarzenie jednodniowe) i hospitalizacja matki."""
    profile_json["specialEvents"] = [
        {"kind": "STILLBIRTH", "dateFrom": "2026-11-12"},
        {"kind": "MOTHER_HOSPITALIZATION", "dateFrom": "2027-01-10", "dateTo": "2027-02-20"},
    ]
    events = Profile.model_validate(profile_json).special_events
    assert [e.date_to for e in events] == [None, date(2027, 2, 20)]


def test_leave_part_defaults_to_no_work(profile_json: JsonDict) -> None:
    profile_json["leavePlan"] = [
        {"parent": "FATHER", "type": "OJCOWSKI", "dateFrom": "2026-11-20", "dateTo": "2026-12-03"}
    ]
    assert Profile.model_validate(profile_json).leave_plan[0].work_fraction == Decimal(0)


def test_special_event_dates_in_order(profile_json: JsonDict) -> None:
    profile_json["specialEvents"] = [
        {"kind": "MOTHER_HOSPITALIZATION", "dateFrom": "2027-01-10", "dateTo": "2027-01-01"}
    ]
    with pytest.raises(ValidationError, match="MOTHER_HOSPITALIZATION"):
        Profile.model_validate(profile_json)


def test_stage_info_flags_must_be_unique() -> None:
    assert StageInfo(stage=Stage.E2, flags=[Flag.DIFFICULT]).stage is Stage.E2
    assert StageInfo(stage=None).flags == []
    with pytest.raises(ValidationError, match="powtórzone"):
        StageInfo(stage=Stage.E2, flags=[Flag.DIFFICULT, Flag.DIFFICULT])
