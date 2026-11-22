"""Zasiłek macierzyński i zasiłek w wysokości macierzyńskiego (TE-16…TE-22, TE-24; T2–T5)."""

from datetime import date

import pytest

from contracts import Verdict
from rules_engine.eligibility import (
    Decision,
    check_equivalent_maternity,
    check_maternity,
    check_sickness_in_pregnancy,
)
from rules_engine.params import current_params
from rules_engine.params.base import kp
from rules_engine.testing import make_profile, period

BIRTH = {"birthDate": "2026-11-12"}
EXPECTED = {"expectedBirthDate": "2026-11-20"}


# --- A.01: podstawowa reguła -------------------------------------------------------------


def test_employee_insured_on_birth_date_gets_maternity() -> None:
    decision = check_maternity(make_profile())
    assert decision.verdict is Verdict.YES
    assert "Nie obowiązuje okres wyczekiwania" in decision.summary
    assert decision.facts[0].label == "Data porodu"
    assert decision.assumptions == ()


def test_expected_birth_gives_prediction() -> None:
    decision = check_maternity(make_profile(child=EXPECTED))
    assert decision.verdict is Verdict.YES
    assert any("Prognoza" in a for a in decision.assumptions)


def test_adoption_counts_from_placement_date() -> None:
    child = {
        "placement": {
            "kind": "ADOPTION",
            "childBirthDate": "2017-06-01",
            "placementDate": "2026-10-01",
        }
    }
    decision = check_maternity(make_profile(child=child))
    assert decision.verdict is Verdict.YES
    assert decision.facts[0].label == "Data przyjęcia dziecka"


# --- TE-16 / T2: zlecenie, dobrowolne chorobowe krócej niż 90 dni -----------------------


def test_t2_maternity_without_waiting_period_but_no_sickness_benefit() -> None:
    profile = make_profile(
        [period("MANDATE_CONTRACT", "VOLUNTARY", "2026-10-01")],
        EXPECTED,
        sick_leaves=[{"dateFrom": "2026-11-10", "dateTo": "2026-11-19", "code": "B"}],
    )
    assert check_maternity(profile).verdict is Verdict.YES
    sickness = check_sickness_in_pregnancy(profile, date(2026, 11, 21), current_params())
    assert sickness.verdict is Verdict.NO
    assert "40 dni" in sickness.summary


# --- TE-17: ubezpieczenie w dniu porodu --------------------------------------------------


@pytest.mark.parametrize(
    ("end", "verdict"), [("2026-11-11", Verdict.NO), ("2026-11-12", Verdict.YES)]
)
def test_maternity_requires_insurance_on_birth_date(end: str, verdict: Verdict) -> None:
    profile = make_profile([period("MANDATE_CONTRACT", "VOLUNTARY", "2025-01-01", end)])
    assert check_maternity(profile).verdict is verdict


# --- TE-18 / A.08: brak ubezpieczenia chorobowego ----------------------------------------


def test_no_sickness_insurance_returns_no_with_alternatives() -> None:
    decision = check_maternity(make_profile([period("MANDATE_CONTRACT", "NONE", "2025-01-01")]))
    assert decision.verdict is Verdict.NO
    assert "bez ubezpieczenia chorobowego" in decision.summary
    assert len(decision.alternatives) == 2
    assert "Świadczenie rodzicielskie" in decision.alternatives[0]


# --- TE-19 / T4: umowa zakończona przed porodem -------------------------------------------


def test_t4_mandate_ended_before_birth_returns_no() -> None:
    profile = make_profile(
        [period("MANDATE_CONTRACT", "VOLUNTARY", "2025-01-01", "2026-09-30", "CONTRACT_EXPIRY")]
    )
    decision = check_maternity(profile)
    assert decision.verdict is Verdict.NO
    assert "nie masz ubezpieczenia chorobowego" in decision.summary
    assert decision.alternatives


def test_fixed_term_employment_ended_before_birth_asks_about_prolongation() -> None:
    """Umowa na czas określony mogła zostać przedłużona do dnia porodu (art. 177 § 3 KP)."""
    profile = make_profile(
        [period("EMPLOYMENT", "MANDATORY", "2025-01-01", "2026-09-30", "CONTRACT_EXPIRY")]
    )
    decision = check_maternity(profile)
    assert decision.verdict is Verdict.NEED_INFO
    assert decision.missing == ("applicant.insurance.periods",)
    assert "przedłuż" in decision.summary
    assert kp("art. 177 § 3") in decision.legal_basis


def test_employment_ended_in_pregnancy_for_other_reason_is_no() -> None:
    """Np. rozwiązanie za porozumieniem stron – nie zachowuje prawa do zasiłku."""
    profile = make_profile([period("EMPLOYMENT", "MANDATORY", "2023-01-02", "2026-08-31", "OTHER")])
    decision = check_maternity(profile)
    assert decision.verdict is Verdict.NO
    assert decision.alternatives


def test_employment_ended_before_pregnancy_is_no() -> None:
    profile = make_profile(
        [period("EMPLOYMENT", "MANDATORY", "2020-01-01", "2024-12-31", "LIQUIDATION")]
    )
    assert check_maternity(profile).verdict is Verdict.NO


# --- TE-20 / T5: likwidacja pracodawcy w ciąży -------------------------------------------


@pytest.mark.parametrize("reason", ["LIQUIDATION", "BANKRUPTCY", "EMPLOYER_DEATH"])
def test_t5_employer_liquidation_grants_benefit_until_birth(reason: str) -> None:
    profile = make_profile([period("EMPLOYMENT", "MANDATORY", "2023-01-02", "2026-06-30", reason)])

    until_birth = check_equivalent_maternity(profile)
    assert until_birth.verdict is Verdict.YES
    assert until_birth.period == (date(2026, 7, 1), date(2026, 11, 11))
    assert "Przyjęto, że pracodawca nie zapewnił innego zatrudnienia." in until_birth.assumptions

    after_birth = check_maternity(profile)
    assert after_birth.verdict is Verdict.YES
    assert "od dnia porodu" in after_birth.summary


def test_equivalent_benefit_not_for_other_termination_reasons() -> None:
    profile = make_profile([period("EMPLOYMENT", "MANDATORY", "2023-01-02", "2026-06-30", "OTHER")])
    assert check_equivalent_maternity(profile).verdict is Verdict.NO


def test_equivalent_benefit_needs_birth_date() -> None:
    decision = check_equivalent_maternity(make_profile(child={}))
    assert decision.verdict is Verdict.NEED_INFO
    assert decision.missing == ("child.expectedBirthDate",)


def test_equivalent_benefit_prediction_before_birth() -> None:
    profile = make_profile(
        [period("EMPLOYMENT", "MANDATORY", "2023-01-02", "2026-06-30", "LIQUIDATION")], EXPECTED
    )
    decision = check_equivalent_maternity(profile)
    assert decision.period == (date(2026, 7, 1), date(2026, 11, 19))
    assert any("Prognoza" in a for a in decision.assumptions)


# --- TE-21 / T3: działalność z zadłużeniem -----------------------------------------------


def test_t3_business_with_debt_needs_info_and_warns() -> None:
    profile = make_profile([period("BUSINESS", "VOLUNTARY", "2022-03-01")], debt="1500.00")
    decision = check_maternity(profile)
    assert decision.verdict is Verdict.NEED_INFO
    assert decision.missing == ("applicant.insurance.contributionDebt",)
    assert "1 500,00 zł" in decision.warnings[0]


def test_business_with_unknown_debt_needs_info() -> None:
    decision = check_maternity(make_profile([period("BUSINESS", "VOLUNTARY", "2022-03-01")]))
    assert decision.verdict is Verdict.NEED_INFO
    assert decision.missing == ("applicant.insurance.contributionDebt",)


def test_business_without_debt_gets_maternity() -> None:
    profile = make_profile([period("BUSINESS", "VOLUNTARY", "2022-03-01")], debt="0")
    assert check_maternity(profile).verdict is Verdict.YES


# --- TE-22: brak danych to NEED_INFO, nie NO -----------------------------------------------


@pytest.mark.parametrize(
    ("periods", "child", "missing"),
    [
        (None, {}, "child.expectedBirthDate"),
        ([], BIRTH, "applicant.insurance.periods"),
    ],
    ids=["no_dates", "no_insurance_data"],
)
def test_missing_fact_yields_need_info_not_no(
    periods: list[dict[str, str]] | None, child: dict[str, str], missing: str
) -> None:
    decision = check_maternity(make_profile(periods, child))
    assert decision.verdict is Verdict.NEED_INFO
    assert decision.missing == (missing,)


# --- TE-24: ryzyko zakwestionowania umowy (H.06) -----------------------------------------


def test_contract_signed_during_pregnancy_flags_risk_without_changing_verdict() -> None:
    salaries = {
        "2026-07": "4000.00",
        "2026-08": "4000.00",
        "2026-09": "4000.00",
        "2026-10": "9000.00",
    }
    profile = make_profile([period("EMPLOYMENT", "MANDATORY", "2026-06-01")], salaries=salaries)
    decision = check_maternity(profile)
    assert decision.verdict is Verdict.YES
    assert len(decision.warnings) == 2
    assert "w czasie ciąży" in decision.warnings[0]
    assert "wyraźnie wyższy" in decision.warnings[1]


def test_long_standing_contract_has_no_risk_warning() -> None:
    assert check_maternity(make_profile()).warnings == ()


# --- Decision: walidacja -----------------------------------------------------------------


def test_decision_requires_missing_only_for_need_info() -> None:
    with pytest.raises(ValueError, match="NEED_INFO"):
        Decision(verdict=Verdict.NEED_INFO, summary="x", legal_basis=(kp("art. 1"),))
    with pytest.raises(ValueError, match="NEED_INFO"):
        Decision(verdict=Verdict.YES, summary="x", legal_basis=(kp("art. 1"),), missing=("a",))


def test_decision_requires_legal_basis() -> None:
    with pytest.raises(ValueError, match="podstawy prawnej"):
        Decision(verdict=Verdict.YES, summary="x")
