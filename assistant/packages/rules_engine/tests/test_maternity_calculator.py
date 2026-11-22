"""Kalkulator zasiłku macierzyńskiego (TE-37…TE-41, scenariusz T1).

Kwoty przeliczone ręcznie:
- podstawa 6000,00 zł: 81,5% → 4890,00/mies., 163,00/dzień; 100% → 200,00/dzień; 70% → 140,00/dzień
- urlop macierzyński 20 tyg. = 140 dni, rodzicielski matki 32 tyg. = 224 dni
"""

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

import pytest

from contracts import AnswerCard, PeriodType, Profile
from rules_engine.calculators.maternity import MaternityCalculation, Variant, calc_maternity
from rules_engine.outcomes import NeedInfo
from rules_engine.params import current_params
from rules_engine.params.base import uz
from rules_engine.testing import make_profile

PARAMS = current_params()
BIRTH = date(2026, 11, 12)
TODAY = BIRTH + timedelta(days=12)
BASE = Decimal("6000.00")
T1_SALARIES = {
    f"{y}-{m:02d}": "7000.00"
    for y, m in [(2025, 11), (2025, 12)] + [(2026, i) for i in range(1, 11)]
}


def calc(
    profile: Profile | None = None,
    *,
    today: date = TODAY,
    base: Decimal | None = None,
    application_date: date | None = None,
) -> MaternityCalculation:
    result = calc_maternity(
        profile or make_profile(), PARAMS, today, base=base, application_date=application_date
    )
    assert isinstance(result, MaternityCalculation), result
    return result


# --- TE-37: wariant 81,5% ----------------------------------------------------------------


def test_maternity_variant_815() -> None:
    result = calc(base=BASE).uniform
    assert result.variant is Variant.UNIFORM_815
    assert result.available
    assert [p.monthly for p in result.periods] == [Decimal("4890.00")] * 2
    assert [p.daily for p in result.periods] == [Decimal("163.00")] * 2
    assert [(p.type, p.start, p.end) for p in result.periods] == [
        (PeriodType.MACIERZYNSKI, date(2026, 11, 12), date(2027, 3, 31)),
        (PeriodType.RODZICIELSKI, date(2027, 4, 1), date(2027, 11, 10)),
    ]
    assert result.weeks == 52
    assert result.total == Decimal("59332.00")  # 364 dni × 163,00


# --- TE-38: wariant 100% + 70% -----------------------------------------------------------


def test_maternity_variant_100_70() -> None:
    result = calc(base=BASE).standard
    assert [p.monthly for p in result.periods] == [Decimal("6000.00"), Decimal("4200.00")]
    assert [p.amount for p in result.periods] == [Decimal("28000.00"), Decimal("31360.00")]
    assert result.total == Decimal("59360.00")


# --- TE-39: termin 21 dni na wniosek o 81,5% ---------------------------------------------


@pytest.mark.parametrize(("day", "available"), [(21, True), (22, False)])
def test_variant_815_application_deadline(day: int, available: bool) -> None:
    result = calc(base=BASE, application_date=BIRTH + timedelta(days=day))
    assert result.uniform.available is available
    assert result.recommended is (result.uniform if available else result.standard)
    if not available:
        assert "do 03.12.2026" in (result.uniform.reason_unavailable or "")
        assert "niedostępny" in result.uniform.describe()


# --- TE-40: fakt „pozostało N dni” (bez przypomnień – U9) --------------------------------


@pytest.mark.parametrize(
    ("today", "text"),
    [
        (TODAY, "do 03.12.2026 (pozostało 9 dni)"),
        (BIRTH + timedelta(days=21), "do 03.12.2026 (pozostało 0 dni)"),
        (BIRTH + timedelta(days=30), "termin minął 03.12.2026"),
    ],
)
def test_days_left_fact(today: date, text: str) -> None:
    facts = {f.label: f.value for f in calc(base=BASE, today=today).facts()}
    assert facts["Termin wniosku o wariant 81,5%"] == text


def test_prediction_before_birth_has_generic_deadline() -> None:
    result = calc(make_profile(child={"expectedBirthDate": "2027-01-20"}), base=BASE)
    assert result.days_left is None
    assert result.uniform.available
    assert {f.label: f.value for f in result.facts()}["Termin wniosku o wariant 81,5%"].startswith(
        "do 21 dni po porodzie"
    )


def test_facts_compare_both_variants() -> None:
    facts = {f.label: f.value for f in calc(base=BASE).facts()}
    assert "łącznie 59 332,00 zł" in facts["Wariant 81,5% za cały okres"]
    assert "4 200,00 zł/mies. (70%) przez 32 tyg." in facts["Wariant 100% + 70%"]


# --- TE-41 / T1: stawka dzienna i podstawa z przychodów ----------------------------------


def test_t1_employee_amounts_from_salaries() -> None:
    result = calc(make_profile(salaries=T1_SALARIES, payer=(45, "2025-11-30")))
    assert result.base == Decimal("6040.30")  # 7000,00 − 13,71%
    uniform = result.uniform
    assert uniform.periods[0].monthly == Decimal("4922.84")  # 6040,30 × 81,5%
    assert uniform.periods[0].daily == Decimal("164.09")  # 4922,8445 / 30
    assert [p.amount for p in uniform.periods] == [Decimal("22972.60"), Decimal("36756.16")]
    assert uniform.total == Decimal("59728.76")
    assert result.facts()[0].label == "Podstawa wymiaru"
    assert uz("art. 36") in result.legal_basis


def test_calculation_is_valid_contract_for_answer_card() -> None:
    result = calc(base=BASE)
    calculation = result.recommended.to_calculation(result.base, result.assumptions)
    card = AnswerCard.model_validate(
        {
            "intentId": "B.01_wysokosc_macierzynskiego",
            "verdict": "YES",
            "summary": "Kwota zasiłku.",
            "calculation": calculation.model_dump(by_alias=True),
            "legalBasis": [
                {"act": "ustawa zasiłkowa", "article": "art. 31", "url": uz("art. 31").url}
            ],
            "actions": [{"type": "SIMULATE", "label": "Porównaj warianty"}],
            "engineVersion": PARAMS.version_id,
            "generatedBy": "RULES",
        }
    )
    assert card.calculation is not None
    assert card.calculation.total == Decimal("59332.00")
    assert card.calculation.monthly == Decimal("4890.00")


# --- warianty sytuacji -------------------------------------------------------------------


@pytest.mark.parametrize(
    ("child", "weeks"),
    [
        ({"birthDate": "2026-11-12", "childrenCount": 2}, 31 + 34),
        ({"birthDate": "2026-11-12", "zaZyciem": True}, 20 + 56),
    ],
    ids=["twins", "za_zyciem"],
)
def test_longer_leave_variants(child: dict[str, Any], weeks: int) -> None:
    assert calc(make_profile(child=child), base=BASE).uniform.weeks == weeks


def test_stillbirth_only_maternity_at_100_percent() -> None:
    profile = make_profile(events=[{"kind": "STILLBIRTH", "dateFrom": "2026-11-12"}])
    result = calc_maternity(profile, PARAMS, TODAY, base=BASE)
    assert isinstance(result, MaternityCalculation)
    assert not result.uniform.available
    assert result.recommended is result.standard
    assert len(result.standard.periods) == 1
    assert result.standard.periods[0].days == 56
    assert result.standard.total == Decimal("11200.00")  # 56 × 200,00


def test_adoption_counts_from_placement() -> None:
    child = {
        "placement": {
            "kind": "ADOPTION",
            "childBirthDate": "2020-01-01",
            "placementDate": "2026-11-12",
        }
    }
    result = calc(make_profile(child=child), base=BASE)
    assert result.event_date == date(2026, 11, 12)
    assert result.uniform.total == Decimal("59332.00")


def test_missing_dates_need_info() -> None:
    result = calc_maternity(make_profile(child={}), PARAMS, TODAY, base=BASE)
    assert isinstance(result, NeedInfo)
    assert result.missing == ("child.expectedBirthDate",)


def test_missing_salaries_propagate_need_info() -> None:
    result = calc_maternity(make_profile(), PARAMS, TODAY)
    assert isinstance(result, NeedInfo)
    assert result.missing == ("applicant.insurance.salaries",)
