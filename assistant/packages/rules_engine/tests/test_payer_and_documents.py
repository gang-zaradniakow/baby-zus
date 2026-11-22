"""Kto wypłaca i jakie dokumenty (TE-25…TE-27)."""

from datetime import date
from typing import Any

import pytest

from contracts import InsuranceTitle, Profile
from rules_engine.documents import (
    BIRTH_CERTIFICATE,
    COURT_ORDER,
    EZLA,
    LEAVE_REQUEST,
    Z3,
    Z3A,
    ZAM,
    BenefitKind,
    DocumentList,
    required_documents,
)
from rules_engine.outcomes import NeedInfo
from rules_engine.params import current_params
from rules_engine.payer import Payer, PayerDecision, determine_payer
from rules_engine.testing import make_profile, period

PARAMS = current_params()
BIRTH = date(2026, 11, 12)
TODAY = date(2026, 11, 21)


def with_payer(count: int | None, count_date: str = "2025-11-30", **kwargs: Any) -> Profile:
    payer = None if count is None else (count, count_date)
    return make_profile(payer=payer, **kwargs)


def payer_of(profile: Profile, day: date = BIRTH) -> PayerDecision:
    decision = determine_payer(profile.applicant.insurance, day, PARAMS)
    assert isinstance(decision, PayerDecision), decision
    return decision


# --- TE-25: próg 20 ubezpieczonych -------------------------------------------------------


@pytest.mark.parametrize(
    ("count", "payer", "name"),
    [(20, Payer.ZUS, "ZUS"), (21, Payer.CONTRIBUTION_PAYER, "pracodawca"), (0, Payer.ZUS, "ZUS")],
)
def test_payer_threshold(count: int, payer: Payer, name: str) -> None:
    decision = payer_of(with_payer(count))
    assert decision.payer is payer
    assert decision.payer_name == name
    assert f"{count} (próg: więcej niż 20)" == decision.facts[0].value


def test_mandate_contract_payer_is_called_zleceniodawca() -> None:
    profile = with_payer(45, periods=[period("MANDATE_CONTRACT", "VOLUNTARY", "2024-01-01")])
    decision = payer_of(profile)
    assert decision.payer is Payer.CONTRIBUTION_PAYER
    assert decision.payer_name == "zleceniodawca"
    assert "zleceniodawca" in decision.summary


# --- TE-26: stan na 30.11 roku poprzedniego ----------------------------------------------


def test_payer_uses_count_on_30_november_previous_year() -> None:
    assert payer_of(with_payer(15, "2025-11-30")).payer is Payer.ZUS


def test_count_from_wrong_year_needs_info() -> None:
    outcome = determine_payer(with_payer(45, "2024-11-30").applicant.insurance, BIRTH, PARAMS)
    assert isinstance(outcome, NeedInfo)
    assert outcome.missing == ("applicant.insurance.payer",)
    assert "30.11.2025" in outcome.reason


def test_unknown_payer_size_needs_info() -> None:
    outcome = determine_payer(with_payer(None).applicant.insurance, BIRTH, PARAMS)
    assert isinstance(outcome, NeedInfo)


# --- ZUS zawsze: działalność, po ustaniu ubezpieczenia ----------------------------------


def test_business_is_always_paid_by_zus() -> None:
    decision = payer_of(make_profile([period("BUSINESS", "VOLUNTARY", "2022-01-01")]))
    assert decision.payer is Payer.ZUS
    assert decision.title is InsuranceTitle.BUSINESS


def test_after_termination_zus_pays() -> None:
    profile = make_profile(
        [period("EMPLOYMENT", "MANDATORY", "2023-01-01", "2026-06-30", "LIQUIDATION")]
    )
    decision = payer_of(profile)
    assert decision.payer is Payer.ZUS
    assert decision.title is None
    assert decision.payer_name == "ZUS"


# --- TE-27: dokumenty wg profilu (§3.2) --------------------------------------------------


def docs(
    profile: Any, kind: BenefitKind = BenefitKind.MATERNITY, today: date = TODAY
) -> DocumentList:
    result = required_documents(profile, kind, BIRTH, PARAMS, today)
    assert isinstance(result, DocumentList), result
    return result


MANDATE = [period("MANDATE_CONTRACT", "VOLUNTARY", "2024-01-01")]
BUSINESS = [period("BUSINESS", "VOLUNTARY", "2022-01-01")]


@pytest.mark.parametrize(
    ("profile", "expected", "where"),
    [
        (with_payer(45), (LEAVE_REQUEST, BIRTH_CERTIFICATE), "u płatnika (pracodawca)"),
        (with_payer(12), (LEAVE_REQUEST, Z3), "u pracodawcy – przekaże go do ZUS"),
        (with_payer(45, periods=MANDATE), (ZAM, BIRTH_CERTIFICATE), "u płatnika (zleceniodawca)"),
        (with_payer(8, periods=MANDATE), (ZAM, Z3A), "w ZUS"),
        (make_profile(BUSINESS), (ZAM,), "w ZUS"),
    ],
    ids=[
        "employee_big_payer",
        "employee_small_payer",
        "mandate_big_payer",
        "mandate_small_payer",
        "business",
    ],
)
def test_maternity_documents_per_profile(
    profile: Any, expected: tuple[Any, ...], where: str
) -> None:
    result = docs(profile)
    assert result.documents == expected
    assert where in result.where


def test_business_note_about_z3b_and_debt() -> None:
    result = docs(make_profile(BUSINESS))
    assert any("Z-3b" in note for note in result.notes)


def test_after_termination_needs_zam_and_z3_from_former_employer() -> None:
    profile = make_profile(
        [period("EMPLOYMENT", "MANDATORY", "2023-01-01", "2026-06-30", "LIQUIDATION")]
    )
    result = docs(profile)
    assert result.documents == (ZAM, Z3)
    assert "były pracodawca" in result.notes[0]


def test_adoption_adds_court_order() -> None:
    child = {
        "placement": {
            "kind": "ADOPTION",
            "childBirthDate": "2018-01-01",
            "placementDate": "2026-11-12",
        }
    }
    profile = with_payer(45, child=child)
    assert docs(profile).documents[-1] == COURT_ORDER


@pytest.mark.parametrize(
    ("profile", "expected"),
    [
        (with_payer(45), (EZLA,)),
        (with_payer(12), (EZLA, Z3)),
        (with_payer(8, periods=MANDATE), (EZLA, Z3A)),
        (make_profile(BUSINESS), (EZLA,)),
    ],
    ids=["employee_big_payer", "employee_small_payer", "mandate_small_payer", "business"],
)
def test_sickness_documents(profile: Any, expected: tuple[Any, ...]) -> None:
    assert docs(profile, BenefitKind.SICKNESS).documents == expected


def test_documents_need_payer_info() -> None:
    result = required_documents(with_payer(None), BenefitKind.MATERNITY, BIRTH, PARAMS, TODAY)
    assert isinstance(result, NeedInfo)


def test_documents_before_new_rules_warn() -> None:
    result = docs(with_payer(45), today=date(2026, 10, 1))
    assert any("ZAM, ZUR i ZAO" in note for note in result.notes)


def test_documents_carry_legal_basis() -> None:
    result = docs(with_payer(45))
    acts = {basis.act.value for basis in result.legal_basis}
    assert acts == {"rozporządzenie w sprawie dokumentów zasiłkowych", "ustawa zasiłkowa"}
