"""``evaluate``: intencja + profil → karta (ZUS-19, TE-58) i gałęzie reguł dla intencji."""

import json
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator

from contracts import AnswerCard, FactSource, PeriodType, Profile, Verdict
from rules_engine.catalog import INTENTS
from rules_engine.evaluate import HANDLERS, LEVEL2_ONLY, Unsupported, anchor, evaluate
from rules_engine.params import current_params, v2023_04_26

TODAY = date(2026, 11, 22)
SCHEMA_PATH = Path(__file__).resolve().parents[3] / "docs" / "contracts" / "answer-card.schema.json"
VALIDATOR = Draft202012Validator(json.loads(SCHEMA_PATH.read_text(encoding="utf-8")))
MONTHS = [f"2025-{m:02d}" for m in (11, 12)] + [f"2026-{m:02d}" for m in range(1, 11)]


def insurance(source: str = "ZUS", **extra: Any) -> dict[str, Any]:
    data: dict[str, Any] = {
        "source": source,
        "periods": [{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2023-01-02"}],
        "salaries": [{"month": m, "gross": "7000.00"} for m in MONTHS],
        "payer": {"insuredCountNov30": 45, "countDate": "2025-11-30"},
    }
    return {**data, **extra}


def persona(**overrides: Any) -> Profile:
    data: dict[str, Any] = {
        "profileId": "p-evaluate",
        "applicant": {"role": "MOTHER", "insurance": insurance()},
        "partner": {"role": "FATHER", "insurance": insurance("USER")},
        "child": {
            "source": "ZUS",
            "birthDate": "2026-11-12",
            "gestationalWeeks": 30,
            "birthWeightG": 1400,
        },
        "specialEvents": [
            {"kind": "CHILD_HOSPITALIZATION", "dateFrom": "2026-11-12", "dateTo": "2026-11-30"}
        ],
        "leavePlan": [
            {
                "parent": "MOTHER",
                "type": "RODZICIELSKI",
                "dateFrom": "2027-04-01",
                "dateTo": "2027-09-29",
            },
            {
                "parent": "FATHER",
                "type": "RODZICIELSKI",
                "dateFrom": "2027-09-30",
                "dateTo": "2028-01-26",
                "workFraction": "0.5",
            },
        ],
    }
    return Profile.model_validate({**data, **overrides})


PERSONAS = {
    "full": persona(),
    "pregnant": persona(
        child={"source": "USER", "expectedBirthDate": "2027-03-01"},
        applicant={
            "role": "MOTHER",
            "insurance": insurance(
                sickLeaves=[{"dateFrom": "2026-11-02", "dateTo": "2026-11-30", "code": "B"}]
            ),
        },
    ),
    "empty": persona(
        applicant={"role": "MOTHER", "insurance": {"source": "USER"}},
        partner=None,
        child={"source": "USER"},
        specialEvents=[],
        leavePlan=[],
    ),
}
HANDLED = sorted(HANDLERS)


def card(intent_id: str, profile: Profile, today: date = TODAY) -> AnswerCard:
    result = evaluate(intent_id, profile, today)
    assert isinstance(result, AnswerCard), result
    return result


# --- TE-58: każda karta z silnika ----------------------------------------------------


@pytest.mark.parametrize("persona_name", sorted(PERSONAS))
@pytest.mark.parametrize("intent_id", HANDLED)
def test_te58_every_engine_card_has_legal_basis_and_matches_schema(
    intent_id: str, persona_name: str
) -> None:
    result = card(intent_id, PERSONAS[persona_name])
    assert result.legal_basis
    assert all(ref.url.startswith("https://") for ref in result.legal_basis)
    payload = result.model_dump(mode="json")
    VALIDATOR.validate(payload)
    assert AnswerCard.model_validate(payload) == result


def test_catalog_is_split_between_engine_and_level2() -> None:
    assert set(HANDLERS).isdisjoint(LEVEL2_ONLY)
    assert set(HANDLERS) | set(LEVEL2_ONLY) == {intent.id for intent in INTENTS}


@pytest.mark.parametrize("intent_id", sorted(LEVEL2_ONLY))
def test_level2_intents_return_unsupported_with_legal_basis(intent_id: str) -> None:
    result = evaluate(intent_id, PERSONAS["full"], TODAY)
    assert isinstance(result, Unsupported)
    assert result.legal_basis
    assert result.reason == LEVEL2_ONLY[intent_id]


def test_unknown_intent_raises() -> None:
    with pytest.raises(KeyError, match="nieznana intencja"):
        evaluate("X.99_nie_ma", PERSONAS["full"], TODAY)


def test_event_before_first_param_set_is_unsupported() -> None:
    old = persona(child={"source": "USER", "birthDate": "2022-01-10"})
    result = evaluate("C.01_wymiar_macierzynskiego", old, TODAY)
    assert isinstance(result, Unsupported)
    assert "sprzed zakresu" in result.reason


def test_explicit_params_and_engine_version() -> None:
    result = evaluate(
        "C.01_wymiar_macierzynskiego", PERSONAS["full"], TODAY, params=v2023_04_26.PARAMS
    )
    assert isinstance(result, AnswerCard)
    assert result.engine_version == "params-2023-04-26"
    assert card("C.01_wymiar_macierzynskiego", PERSONAS["full"]).engine_version == (
        current_params().version_id
    )


def test_out_of_scope_becomes_unsupported() -> None:
    # zatrudnienie od 05.11.2026 – brak pełnego miesiąca ubezpieczenia przed porodem
    late = persona(
        applicant={
            "role": "MOTHER",
            "insurance": insurance(
                periods=[{"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2026-11-05"}]
            ),
        }
    )
    result = evaluate("B.01_wysokosc_macierzynskiego", late, TODAY)
    assert isinstance(result, Unsupported)
    assert any(ref.article == "art. 37" for ref in result.legal_basis)


def test_anchor_prefers_placement_then_birth() -> None:
    adopted = persona(
        child={
            "source": "USER",
            "birthDate": "2020-01-01",
            "placement": {
                "kind": "ADOPTION",
                "childBirthDate": "2020-01-01",
                "placementDate": "2026-11-02",
            },
        }
    )
    assert anchor(adopted) == (date(2026, 11, 2), True)
    assert anchor(PERSONAS["pregnant"]) == (date(2027, 3, 1), False)
    assert anchor(PERSONAS["empty"]) is None


# --- A: uprawnienia ------------------------------------------------------------------


def test_a01_yes_with_documents_action() -> None:
    result = card("A.01_prawo_do_macierzynskiego", PERSONAS["full"])
    assert result.verdict is Verdict.YES
    assert result.actions[0].ref == "G.01_jakie_dokumenty"


def test_a03_rehabilitation_after_exhausted_period() -> None:
    sick = persona(
        child={"source": "USER", "expectedBirthDate": "2027-06-01"},
        applicant={
            "role": "MOTHER",
            "insurance": insurance(
                sickLeaves=[{"dateFrom": "2026-01-02", "dateTo": "2026-11-20", "code": "B"}]
            ),
        },
    )
    yes = card("A.03_swiadczenie_rehabilitacyjne", sick)
    assert yes.verdict is Verdict.YES
    assert "lekarz orzecznik" in yes.summary
    still = card("A.03_swiadczenie_rehabilitacyjne", PERSONAS["pregnant"])
    assert still.verdict is Verdict.NO
    assert still.alternatives


# --- B: wysokość ---------------------------------------------------------------------


def test_b01_amounts_match_calculator() -> None:
    result = card("B.01_wysokosc_macierzynskiego", PERSONAS["full"])
    assert result.calculation is not None
    assert result.calculation.base == Decimal("6040.30")
    assert result.calculation.rate == Decimal("0.815")
    assert result.calculation.monthly == Decimal("4922.84")
    assert {r.article for r in result.legal_basis} >= {"art. 29", "art. 31"}


def test_b04_compares_both_variants() -> None:
    result = card("B.04_warianty_urlopu", PERSONAS["full"])
    assert "81,5%" in result.summary
    assert "100%" in result.summary


@pytest.mark.parametrize(
    ("intent_id", "phrase"),
    [("B.03_kwota_miesieczna", "Miesięcznie"), ("B.06_suma_za_caly_okres", "Łącznie")],
)
def test_b03_b06_summaries(intent_id: str, phrase: str) -> None:
    assert card(intent_id, PERSONAS["full"]).summary.startswith(phrase)


def test_b01_not_eligible_returns_decision_without_calculation() -> None:
    result = card("B.01_wysokosc_macierzynskiego", PERSONAS["empty"])
    assert result.verdict is Verdict.NEED_INFO
    assert result.calculation is None


def test_b01_missing_salaries_needs_info() -> None:
    no_salaries = persona(
        applicant={"role": "MOTHER", "insurance": insurance(salaries=[])},
    )
    result = card("B.01_wysokosc_macierzynskiego", no_salaries)
    assert [m.field for m in result.missing] == ["applicant.insurance.salaries"]


def test_b02_sickness_amount_for_code_b_leave() -> None:
    result = card("B.02_wysokosc_chorobowego_w_ciazy", PERSONAS["pregnant"])
    assert result.calculation is not None
    period = result.calculation.periods[0]
    assert period.type is PeriodType.CHOROBOWY
    assert period.amount == Decimal("201.34") * 29
    assert any("33 dni" in a for a in result.calculation.assumptions)


def test_b02_simulation_without_leave_and_without_code_b() -> None:
    simulated = card("B.02_wysokosc_chorobowego_w_ciazy", PERSONAS["full"])
    assert simulated.calculation is not None
    assert simulated.calculation.periods == []
    no_code = persona(
        applicant={
            "role": "MOTHER",
            "insurance": insurance(sickLeaves=[{"dateFrom": "2026-11-02", "dateTo": "2026-11-10"}]),
        }
    )
    warned = card("B.02_wysokosc_chorobowego_w_ciazy", no_code)
    assert warned.calculation is None
    assert any("kodu „B”" in w for w in warned.warnings)


def test_b02_business_without_salaries_needs_info() -> None:
    contractor = persona(
        applicant={
            "role": "MOTHER",
            "insurance": insurance(
                source="USER",
                periods=[
                    {"title": "MANDATE_CONTRACT", "sickness": "VOLUNTARY", "dateFrom": "2023-01-02"}
                ],
                salaries=[],
            ),
        }
    )
    result = card("B.02_wysokosc_chorobowego_w_ciazy", contractor)
    assert result.verdict is Verdict.NEED_INFO
    assert not any("33 dni" in w for w in result.warnings)


def test_b02_not_insured_is_no() -> None:
    result = card(
        "B.02_wysokosc_chorobowego_w_ciazy",
        persona(
            applicant={
                "role": "MOTHER",
                "insurance": insurance(
                    periods=[
                        {
                            "title": "EMPLOYMENT",
                            "sickness": "MANDATORY",
                            "dateFrom": "2023-01-02",
                            "dateTo": "2024-01-01",
                            "endReason": "OTHER",
                        }
                    ]
                ),
            }
        ),
    )
    assert result.verdict is Verdict.NO


def test_b02_contractor_with_salaries_has_no_employer_pay_assumption() -> None:
    contractor = persona(
        applicant={
            "role": "MOTHER",
            "insurance": insurance(
                source="USER",
                periods=[
                    {"title": "MANDATE_CONTRACT", "sickness": "VOLUNTARY", "dateFrom": "2023-01-02"}
                ],
            ),
        }
    )
    result = card("B.02_wysokosc_chorobowego_w_ciazy", contractor)
    assert result.calculation is not None
    assert not any("33 dni" in a for a in result.calculation.assumptions)


def test_b05_contribution_base() -> None:
    result = card("B.05_podstawa_wymiaru", PERSONAS["full"])
    assert "6\u00a0040,30 zł" in result.summary
    assert result.facts[0].source is FactSource.ZUS
    assert card("B.05_podstawa_wymiaru", PERSONAS["empty"]).verdict is Verdict.NEED_INFO


# --- C: okresy i terminy -------------------------------------------------------------


def test_c01_maternity_weeks_with_prediction_and_loss() -> None:
    predicted = card("C.01_wymiar_macierzynskiego", PERSONAS["pregnant"])
    assert "20 tygodni" in predicted.summary
    assert any("Prognoza" in w for w in predicted.warnings)
    death = persona(specialEvents=[{"kind": "CHILD_DEATH", "dateFrom": "2026-11-20"}])
    shortened = card("C.01_wymiar_macierzynskiego", death)
    assert "8 tygodni" in shortened.summary
    assert card("C.01_wymiar_macierzynskiego", PERSONAS["empty"]).verdict is Verdict.NEED_INFO


def test_c01_odd_days_are_shown() -> None:
    death = persona(specialEvents=[{"kind": "CHILD_DEATH", "dateFrom": "2027-02-01"}])
    assert "dni" in card("C.01_wymiar_macierzynskiego", death).summary


def test_c02_and_f07_parental_weeks() -> None:
    assert "41 tygodni" in card("C.02_wymiar_rodzicielskiego", PERSONAS["full"]).summary
    assert "31.12.2032" in card("C.02_wymiar_rodzicielskiego", PERSONAS["full"]).summary
    za_zyciem = card("F.07_za_zyciem", PERSONAS["full"])
    assert "65 tygodni" in za_zyciem.summary
    assert any("Za życiem" in w for w in za_zyciem.warnings)
    with_certificate = persona(child={"source": "ZUS", "birthDate": "2026-11-12", "zaZyciem": True})
    certified = card("F.07_za_zyciem", with_certificate)
    assert certified.warnings == []
    assert any(f.label == "Zaświadczenie „Za życiem”" for f in certified.facts)
    assert "Wykorzystaj" not in card("C.02_wymiar_rodzicielskiego", PERSONAS["empty"]).summary


def test_c05_c06_f03_tables() -> None:
    assert "61 tygodni" in card("C.05_jak_dlugo_swiadczenie", PERSONAS["full"]).summary
    single = card("C.06_wiecej_niz_jedno_dziecko", PERSONAS["full"]).summary
    assert "2 – 31" in single
    assert "Przy " not in single
    twins = persona(child={"source": "USER", "birthDate": "2026-11-12", "childrenCount": 2})
    assert "Przy 2 dzieciach: 31 + 43" in card("F.03_wiecej_dzieci_przy_porodzie", twins).summary


@pytest.mark.parametrize(
    ("intent_id", "phrase"),
    [
        ("C.04_termin_wniosku", "do 03.12.2026"),
        ("G.04_termin_dokumentow", "Zostało 11 dni"),
        ("H.05_spozniony_wniosek", "nie skorzystasz z wariantu 81,5%"),
    ],
)
def test_deadline_intents(intent_id: str, phrase: str) -> None:
    assert phrase in card(intent_id, PERSONAS["full"]).summary


def test_deadline_passed_and_predicted() -> None:
    late = card("C.04_termin_wniosku", PERSONAS["full"], date(2027, 1, 10))
    assert "Termin minął 03.12.2026" in late.summary
    predicted = card("C.04_termin_wniosku", PERSONAS["pregnant"])
    assert "Zostało" not in predicted.summary
    assert card("C.04_termin_wniosku", PERSONAS["empty"]).missing[0].field == "child.birthDate"


def test_c07_prenatal_leave() -> None:
    result = card("C.07_urlop_przed_porodem", PERSONAS["pregnant"])
    assert "najwcześniej 18.01.2027" in result.summary
    assert card("C.07_urlop_przed_porodem", PERSONAS["full"]).verdict is Verdict.NO
    assert card("C.07_urlop_przed_porodem", PERSONAS["empty"]).verdict is Verdict.NEED_INFO


def test_c08_paternity_deadline_variants() -> None:
    assert "do 11.11.2027" in card("C.08_urlop_ojcowski", PERSONAS["full"]).summary
    late = card("C.08_urlop_ojcowski", PERSONAS["full"], date(2027, 12, 1))
    assert late.verdict is Verdict.NO
    assert card("C.08_urlop_ojcowski", PERSONAS["empty"]).verdict is Verdict.NEED_INFO
    placement: dict[str, Any] = {
        "kind": "ADOPTION",
        "childBirthDate": "2020-01-01",
        "placementDate": "2026-11-02",
    }
    pending = persona(child={"source": "USER", "placement": placement})
    assert card("C.08_urlop_ojcowski", pending).missing[0].field == "child.placement"
    final = persona(
        child={"source": "USER", "placement": {**placement, "rulingFinalDate": "2026-11-15"}}
    )
    assert "do 14.11.2027" in card("C.08_urlop_ojcowski", final).summary


def test_c03_takeover_routes_to_special_rules() -> None:
    hospital = persona(
        specialEvents=[
            {"kind": "MOTHER_HOSPITALIZATION", "dateFrom": "2027-02-01", "dateTo": "2027-02-10"}
        ]
    )
    result = card("C.03_przejecie_urlopu_przez_drugiego_rodzica", hospital)
    assert result.verdict is Verdict.YES
    assert "10 dni" in result.summary


# --- D, E: podział i praca -----------------------------------------------------------


def test_d01_partner_rights() -> None:
    yes = card("D.01_prawa_drugiego_rodzica", PERSONAS["full"])
    assert "urlop ojcowski" in yes.summary
    assert yes.facts[0].source is FactSource.USER
    uninsured = persona(
        partner={
            "role": "FATHER",
            "insurance": insurance(
                "USER",
                periods=[{"title": "BUSINESS", "sickness": "NONE", "dateFrom": "2020-01-01"}],
            ),
        }
    )
    assert card("D.01_prawa_drugiego_rodzica", uninsured).verdict is Verdict.NO
    mother = persona(partner={"role": "MOTHER", "insurance": insurance("USER")})
    assert "ojcowski" not in card("D.01_prawa_drugiego_rodzica", mother).summary
    assert card("D.01_prawa_drugiego_rodzica", PERSONAS["empty"]).missing[0].field == "partner"
    pregnant = card("D.01_prawa_drugiego_rodzica", persona(child={"source": "USER"}))
    assert pregnant.verdict is Verdict.YES


def test_d02_plan_summary_and_facts() -> None:
    result = card("D.02_podzial_rodzicielskiego", PERSONAS["full"])
    assert "wykorzystane 34 z 41 tygodni (zostaje 7)" in result.summary
    assert any("praca 50% etatu" in f.value for f in result.facts)


def test_e05_mentions_extension() -> None:
    result = card("E.05_wydluzenie_urlopu_przy_pracy", PERSONAS["full"])
    assert "wydłuża się o 56 dni" in result.summary


def test_invalid_plan_is_no() -> None:
    too_long = persona(
        leavePlan=[
            {
                "parent": "MOTHER",
                "type": "RODZICIELSKI",
                "dateFrom": "2027-04-01",
                "dateTo": "2028-03-31",
            }
        ]
    )
    result = card("D.02_podzial_rodzicielskiego", too_long)
    assert result.verdict is Verdict.NO
    assert result.alternatives


def test_plan_needs_birth_and_parts() -> None:
    no_birth = persona(child={"source": "USER"})
    assert card("D.02_podzial_rodzicielskiego", no_birth).missing[0].field == "child.birthDate"
    no_plan = persona(leavePlan=[])
    assert card("D.02_podzial_rodzicielskiego", no_plan).missing[0].field == "leavePlan"


def test_d04_amounts_use_each_parent_base() -> None:
    result = card("D.04_wplyw_podzialu_na_kwote", PERSONAS["full"])
    assert result.calculation is not None
    mother, father = result.calculation.periods
    assert mother.rate == Decimal("0.70")
    assert father.rate == Decimal("0.35")
    assert result.calculation.total == mother.amount + father.amount
    assert result.calculation.base == Decimal("6040.30")


def test_d04_partner_problems() -> None:
    no_partner = persona(partner=None)
    assert card("D.04_wplyw_podzialu_na_kwote", no_partner).missing[0].field == "partner"
    partner_no_salaries = persona(
        partner={"role": "FATHER", "insurance": insurance("USER", salaries=[])}
    )
    assert card("E.03_wplyw_pracy_na_kwote", partner_no_salaries).missing[0].field == "partner"
    partner_late = persona(
        partner={
            "role": "FATHER",
            "insurance": insurance(
                "USER",
                periods=[
                    {"title": "EMPLOYMENT", "sickness": "MANDATORY", "dateFrom": "2026-11-05"}
                ],
            ),
        }
    )
    assert isinstance(evaluate("D.04_wplyw_podzialu_na_kwote", partner_late, TODAY), Unsupported)
    father_only = persona(
        leavePlan=[
            {
                "parent": "FATHER",
                "type": "RODZICIELSKI",
                "dateFrom": "2027-04-01",
                "dateTo": "2027-05-26",
            }
        ],
        applicant={"role": "MOTHER", "insurance": insurance(salaries=[])},
    )
    only = card("D.04_wplyw_podzialu_na_kwote", father_only)
    assert only.calculation is not None
    assert only.calculation.base == Decimal("6040.30")


# --- F, G -----------------------------------------------------------------------------


def test_f06_stillbirth_and_child_death() -> None:
    stillbirth = persona(
        child={"source": "USER"},
        specialEvents=[{"kind": "STILLBIRTH", "dateFrom": "2026-11-12"}],
    )
    assert "56 dni" in card("F.06_martwe_urodzenie_smierc_dziecka", stillbirth).summary
    death_no_birth = persona(
        child={"source": "USER"},
        specialEvents=[{"kind": "CHILD_DEATH", "dateFrom": "2026-11-20"}],
    )
    assert card("F.06_martwe_urodzenie_smierc_dziecka", death_no_birth).missing[0].field == (
        "child.birthDate"
    )


def test_g01_g03_documents() -> None:
    docs = card("G.01_jakie_dokumenty", PERSONAS["full"])
    assert docs.summary.startswith("Przygotuj:")
    small_payer = persona(
        applicant={
            "role": "MOTHER",
            "insurance": insurance(payer={"insuredCountNov30": 5, "countDate": "2025-11-30"}),
        }
    )
    forms = card("G.03_jaki_formularz", small_payer)
    assert forms.summary.startswith("Formularze: Z-3")
    no_forms = card("G.03_jaki_formularz", PERSONAS["full"])
    assert no_forms.summary.startswith("Nie wypełniasz formularza ZUS")


def test_g01_branches() -> None:
    sick_only = persona(
        child={"source": "USER"},
        applicant={
            "role": "MOTHER",
            "insurance": insurance(sickLeaves=[{"dateFrom": "2026-11-02", "dateTo": "2026-11-10"}]),
        },
    )
    assert "e-ZLA" in card("G.01_jakie_dokumenty", sick_only).summary
    assert card("G.01_jakie_dokumenty", PERSONAS["empty"]).missing[0].field == (
        "child.expectedBirthDate"
    )
    no_periods = persona(applicant={"role": "MOTHER", "insurance": {"source": "USER"}})
    assert card("G.01_jakie_dokumenty", no_periods).missing[0].field == (
        "applicant.insurance.periods"
    )
    no_payer = persona(applicant={"role": "MOTHER", "insurance": insurance(payer=None)})
    assert card("G.01_jakie_dokumenty", no_payer).missing[0].field == "applicant.insurance.payer"


def test_g02_g05_payer() -> None:
    assert "u płatnika" in card("G.02_gdzie_zlozyc_wniosek", PERSONAS["full"]).summary
    assert "pracodawca" in card("G.05_kto_wyplaca", PERSONAS["full"]).summary
    no_payer = persona(applicant={"role": "MOTHER", "insurance": insurance(payer=None)})
    assert card("G.05_kto_wyplaca", no_payer).verdict is Verdict.NEED_INFO
    assert card("G.02_gdzie_zlozyc_wniosek", no_payer).verdict is Verdict.NEED_INFO
    assert card("G.05_kto_wyplaca", PERSONAS["empty"]).verdict is Verdict.NEED_INFO
    no_date = persona(child={"source": "USER"})
    assert card("G.05_kto_wyplaca", no_date).verdict is Verdict.YES
