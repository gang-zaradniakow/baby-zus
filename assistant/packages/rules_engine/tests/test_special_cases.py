"""Sytuacje szczególne – kategoria F (ZUS-18): TE-50…TE-57, scenariusze T6, T7, T8, T10.

Daty oczekiwane są policzone ręcznie z konwencji: tydzień = 7 dni, koniec włącznie,
dzień porodu = 1. dzień urlopu macierzyńskiego. Poród 12.11.2026 → macierzyński
(1 dziecko) do 31.03.2027; 8 tygodni po porodzie mija 06.01.2027.
"""

from datetime import date
from typing import Any

import pytest

from contracts import PeriodType, PlacementKind, SickLeave, SpecialEvent, SpecialEventKind, Verdict
from rules_engine.calculators.leave_periods import LeavePlanError, maternity_leave
from rules_engine.calculators.special_leaves import (
    HospitalStay,
    adoption_leave,
    father_takeover_leave,
    last_day_before_years,
    merge_stays,
    supplementary_maternity_leave,
    years_later,
)
from rules_engine.eligibility.sickness import check_sickness_in_pregnancy
from rules_engine.eligibility.sickness_period import (
    check_sickness_period,
    sickness_period_status,
)
from rules_engine.eligibility.special import (
    check_adoption,
    check_father_takeover,
    check_supplementary_maternity,
)
from rules_engine.params import current_params, get_params, v2023_04_26
from rules_engine.testing import make_profile, period

P = current_params()
BIRTH = date(2026, 11, 12)
MATERNITY_END = date(2027, 3, 31)
AFTER_8_WEEKS = date(2027, 1, 7)
TODAY = date(2026, 11, 22)


def d(text: str) -> date:
    return date.fromisoformat(text)


def event(kind: SpecialEventKind, start: str, end: str | None = None) -> SpecialEvent:
    return SpecialEvent(kind=kind, date_from=d(start), date_to=d(end) if end else None)


def event_dict(kind: str, start: str, end: str | None = None) -> dict[str, Any]:
    return {"kind": kind, "dateFrom": start, **({"dateTo": end} if end else {})}


def placement(kind: str, child_birth: str, placed: str, deferral: bool = False) -> dict[str, Any]:
    return {
        "placement": {
            "kind": kind,
            "childBirthDate": child_birth,
            "placementDate": placed,
            "schoolDeferral": deferral,
        }
    }


# --- TE-50 / T10: przysposobienie i rodzina zastępcza ---------------------------------


def test_t10_adoption_of_nine_year_old_gives_leave_on_maternity_terms() -> None:
    profile = make_profile(child=placement("ADOPTION", "2017-05-10", "2026-11-02"))
    decision = check_adoption(profile, P)
    assert decision.verdict is Verdict.YES
    assert decision.period == (d("2026-11-02"), d("2027-03-21"))  # 20 tygodni
    assert "na warunkach urlopu macierzyńskiego" in decision.summary
    assert any("wniosek do sądu" in a for a in decision.assumptions)
    assert decision.legal_basis[0].article == "art. 183"


@pytest.mark.parametrize(
    ("child_birth", "verdict"),
    [
        ("2013-01-15", Verdict.YES),  # 13 lat w dniu przyjęcia
        ("2012-11-03", Verdict.YES),  # ostatni dzień przed 14. urodzinami
        ("2012-11-02", Verdict.NO),  # 14. urodziny w dniu przyjęcia
        ("2011-06-01", Verdict.NO),  # 15 lat
    ],
)
def test_te50_adoption_age_limit_14(child_birth: str, verdict: Verdict) -> None:
    profile = make_profile(child=placement("ADOPTION", child_birth, "2026-11-02"))
    assert check_adoption(profile, P).verdict is verdict


def test_adoption_leave_ends_before_fourteenth_birthday() -> None:
    span = adoption_leave(PlacementKind.ADOPTION, d("2013-01-15"), d("2026-11-02"), 1, P)
    assert span.end == d("2027-01-14")
    assert span.type is PeriodType.NA_WARUNKACH_MACIERZYNSKIEGO
    assert any("ukończeniem przez dziecko 14 lat" in note for note in span.notes)


def test_adoption_of_twins_uses_maternity_table() -> None:
    span = adoption_leave(PlacementKind.ADOPTION, d("2020-01-01"), d("2026-11-02"), 2, P)
    assert span.days == 31 * 7


@pytest.mark.parametrize(
    ("child_birth", "deferral", "verdict"),
    [
        ("2020-03-01", False, Verdict.YES),  # 6 lat
        ("2019-11-02", False, Verdict.NO),  # 7. urodziny w dniu przyjęcia
        ("2017-05-10", False, Verdict.NO),  # 9 lat bez odroczenia
        ("2017-05-10", True, Verdict.YES),  # 9 lat z odroczonym obowiązkiem szkolnym
        ("2016-11-02", True, Verdict.NO),  # 10 lat
    ],
)
def test_te50_foster_family_age_limits(child_birth: str, deferral: bool, verdict: Verdict) -> None:
    profile = make_profile(child=placement("FOSTER_FAMILY", child_birth, "2026-11-02", deferral))
    decision = check_adoption(profile, P)
    assert decision.verdict is verdict
    if verdict is Verdict.YES:
        assert any("niezawodowej" in a for a in decision.assumptions)


def test_foster_refusal_mentions_school_deferral() -> None:
    profile = make_profile(child=placement("FOSTER_FAMILY", "2017-05-10", "2026-11-02"))
    decision = check_adoption(profile, P)
    assert "odroczonym obowiązku szkolnym" in decision.summary
    assert decision.alternatives


def test_adoption_needs_placement_data() -> None:
    decision = check_adoption(make_profile(), P)
    assert decision.verdict is Verdict.NEED_INFO
    assert decision.missing == ("child.placement",)


def test_adoption_without_sickness_insurance_is_no() -> None:
    profile = make_profile(
        [period(end="2026-10-31")], child=placement("ADOPTION", "2017-05-10", "2026-11-02")
    )
    decision = check_adoption(profile, P)
    assert decision.verdict is Verdict.NO
    assert "nie masz ubezpieczenia chorobowego" in decision.summary


def test_adoption_without_insurance_periods_needs_info() -> None:
    profile = make_profile([], child=placement("ADOPTION", "2017-05-10", "2026-11-02"))
    assert check_adoption(profile, P).missing == ("applicant.insurance.periods",)


def test_years_later_handles_leap_day() -> None:
    assert years_later(d("2016-02-29"), 7) == d("2023-02-28")
    assert years_later(d("2016-02-29"), 8) == d("2024-02-29")
    assert last_day_before_years(d("2016-02-29"), 7) == d("2023-02-27")


# --- TE-51…TE-53 / T8: przejęcie urlopu przez ojca ------------------------------------


def test_t8_father_takes_over_after_mother_hospitalised_past_8_weeks() -> None:
    span = father_takeover_leave(
        BIRTH, 1, event(SpecialEventKind.MOTHER_HOSPITALIZATION, "2026-12-20", "2027-01-20"), P
    )
    assert (span.start, span.end) == (AFTER_8_WEEKS, d("2027-01-20"))
    assert span.days == 14
    assert any("co najmniej 8 tygodni" in note for note in span.notes)
    assert any(basis.article == "art. 180 § 13" for basis in span.legal_basis)


def test_hospitalisation_after_8_weeks_is_taken_over_entirely() -> None:
    span = father_takeover_leave(
        BIRTH, 1, event(SpecialEventKind.MOTHER_HOSPITALIZATION, "2027-02-01", "2027-02-10"), P
    )
    assert (span.start, span.end, span.days) == (d("2027-02-01"), d("2027-02-10"), 10)
    assert not any("co najmniej 8 tygodni" in note for note in span.notes)


def test_hospitalisation_within_first_8_weeks_gives_nothing() -> None:
    with pytest.raises(LeavePlanError, match="Nie ma części urlopu"):
        father_takeover_leave(
            BIRTH, 1, event(SpecialEventKind.MOTHER_HOSPITALIZATION, "2026-12-01", "2026-12-20"), P
        )


def test_ongoing_hospitalisation_runs_to_end_of_maternity_leave() -> None:
    span = father_takeover_leave(
        BIRTH, 1, event(SpecialEventKind.MOTHER_HOSPITALIZATION, "2027-02-01"), P
    )
    assert span.end == MATERNITY_END
    assert any("Brak daty wypisu" in note for note in span.notes)


def test_te53_mother_death_gives_father_rest_of_leave_without_8_week_wait() -> None:
    span = father_takeover_leave(BIRTH, 1, event(SpecialEventKind.MOTHER_DEATH, "2026-11-20"), P)
    assert (span.start, span.end) == (d("2026-11-21"), MATERNITY_END)
    assert [b.article for b in span.legal_basis] == ["art. 180 § 12"]


def test_mother_death_before_birth_is_rejected() -> None:
    with pytest.raises(LeavePlanError, match="wcześniejsza niż data porodu"):
        father_takeover_leave(BIRTH, 1, event(SpecialEventKind.MOTHER_DEATH, "2026-11-01"), P)


def test_mother_death_after_leave_ended_gives_nothing() -> None:
    with pytest.raises(LeavePlanError):
        father_takeover_leave(BIRTH, 1, event(SpecialEventKind.MOTHER_DEATH, "2027-03-31"), P)


@pytest.mark.parametrize(
    ("abandoned", "start"),
    [("2026-12-01", AFTER_8_WEEKS), ("2027-02-01", d("2027-02-02"))],
)
def test_te53_abandonment_gives_rest_of_leave_after_8_weeks(abandoned: str, start: date) -> None:
    span = father_takeover_leave(BIRTH, 1, event(SpecialEventKind.CHILD_ABANDONMENT, abandoned), P)
    assert (span.start, span.end) == (start, MATERNITY_END)


def test_mother_unable_to_care_resigns_after_8_weeks() -> None:
    span = father_takeover_leave(
        BIRTH, 1, event(SpecialEventKind.MOTHER_UNABLE_TO_CARE, "2027-02-15"), P
    )
    assert (span.start, span.end) == (d("2027-02-15"), MATERNITY_END)


def test_takeover_with_twins_uses_longer_leave() -> None:
    span = father_takeover_leave(BIRTH, 2, event(SpecialEventKind.MOTHER_DEATH, "2027-01-01"), P)
    assert span.end == d("2027-06-16")


def test_other_events_cannot_be_taken_over() -> None:
    with pytest.raises(ValueError, match="nie daje prawa"):
        father_takeover_leave(BIRTH, 1, event(SpecialEventKind.STILLBIRTH, "2026-11-12"), P)


def test_check_father_takeover_yes_with_period() -> None:
    profile = make_profile(
        events=[event_dict("MOTHER_HOSPITALIZATION", "2026-12-20", "2027-01-20")]
    )
    decision = check_father_takeover(profile, P)
    assert decision.verdict is Verdict.YES
    assert decision.period == (AFTER_8_WEEKS, d("2027-01-20"))
    assert "14 dni" in decision.summary
    assert any(f.label == "Pobyt matki w szpitalu" for f in decision.facts)


def test_check_father_takeover_no_when_nothing_left() -> None:
    profile = make_profile(
        events=[event_dict("MOTHER_HOSPITALIZATION", "2026-12-01", "2026-12-20")]
    )
    decision = check_father_takeover(profile, P)
    assert decision.verdict is Verdict.NO
    assert "urlopu ojcowskiego" in decision.alternatives[0]


def test_check_father_takeover_needs_event_and_birth_date() -> None:
    assert check_father_takeover(make_profile(), P).missing == ("specialEvents",)
    profile = make_profile(
        child={"expectedBirthDate": "2026-12-01"},
        events=[event_dict("MOTHER_DEATH", "2026-12-05")],
    )
    assert check_father_takeover(profile, P).missing == ("child.birthDate",)


def test_check_father_takeover_requires_insurance() -> None:
    profile = make_profile(
        [period(end="2026-12-31")], events=[event_dict("MOTHER_DEATH", "2027-01-10")]
    )
    assert check_father_takeover(profile, P).verdict is Verdict.NO


# --- TE-54 / TE-55: uzupełniający urlop macierzyński ----------------------------------


def stays(*ranges: tuple[str, str]) -> list[HospitalStay]:
    return [HospitalStay(d(a), d(b)) for a, b in ranges]


def test_te54_very_preterm_gets_week_per_started_week_of_stay() -> None:
    span = supplementary_maternity_leave(BIRTH, 1, 26, 800, stays(("2026-11-12", "2027-01-20")), P)
    assert span.type is PeriodType.UZUPELNIAJACY_MACIERZYNSKI
    assert (span.start, span.end) == (d("2027-04-01"), d("2027-06-09"))  # 70 dni → 10 tyg.
    assert span.notes[0].startswith("Grupa 1")


def test_very_preterm_capped_at_15_weeks() -> None:
    span = supplementary_maternity_leave(BIRTH, 1, 25, None, stays(("2026-11-12", "2027-04-30")), P)
    assert span.days == 15 * 7


def test_low_weight_alone_qualifies_for_long_window() -> None:
    span = supplementary_maternity_leave(BIRTH, 1, 33, 950, stays(("2026-11-12", "2027-02-01")), P)
    assert span.days == 12 * 7  # 82 dni w oknie 15 tygodni → 12 tyg.


def test_preterm_partial_week_rounds_up_and_window_is_8_weeks() -> None:
    span = supplementary_maternity_leave(BIRTH, 1, 33, 1800, stays(("2026-11-12", "2026-11-26")), P)
    assert span.days == 3 * 7  # 15 dni → 3 tygodnie
    longer = supplementary_maternity_leave(
        BIRTH, 1, 33, 1800, stays(("2026-11-12", "2027-02-20")), P
    )
    assert longer.days == 8 * 7


def test_preterm_without_weight_is_rejected() -> None:
    with pytest.raises(LeavePlanError, match="masa urodzeniowa"):
        supplementary_maternity_leave(BIRTH, 1, 33, None, stays(("2026-11-12", "2026-11-20")), P)


def test_stay_outside_window_gives_nothing() -> None:
    with pytest.raises(LeavePlanError, match="Brak pobytu"):
        supplementary_maternity_leave(BIRTH, 1, 33, 1800, stays(("2027-02-01", "2027-02-05")), P)


def test_te55_term_baby_hospitalised_from_day_5() -> None:
    span = supplementary_maternity_leave(
        BIRTH,
        1,
        39,
        3400,
        stays(("2026-11-12", "2026-11-14"), ("2026-11-20", "2026-11-30")),
        P,
    )
    assert span.days == 2 * 7  # 11 dni (20–30.11) → 2 tygodnie; pobyt porodowy się nie liczy
    assert span.notes[0].startswith("Grupa 3")


def test_term_stay_spanning_day_5_counts_from_day_5() -> None:
    span = supplementary_maternity_leave(BIRTH, 1, 40, 3500, stays(("2026-11-12", "2026-11-19")), P)
    assert span.days == 7  # 17–19.11 = 3 dni → 1 tydzień


@pytest.mark.parametrize(
    "ranges",
    [
        [("2026-11-12", "2026-11-15")],  # tylko przed 5. dniem
        [("2026-11-20", "2026-11-20")],  # jeden dzień
        [("2026-12-11", "2026-12-20")],  # zaczyna się 29. dnia
    ],
)
def test_term_baby_without_qualifying_stay(ranges: list[tuple[str, str]]) -> None:
    with pytest.raises(LeavePlanError, match="co najmniej 2 kolejne dni"):
        supplementary_maternity_leave(BIRTH, 1, 39, 3400, stays(*ranges), P)


def test_supplementary_leave_not_available_before_19_03_2025() -> None:
    with pytest.raises(LeavePlanError, match=r"19\.03\.2025"):
        supplementary_maternity_leave(
            d("2024-11-12"), 1, 26, 800, stays(("2024-11-12", "2025-01-01")), v2023_04_26.PARAMS
        )


def test_supplementary_leave_starts_after_twin_maternity_leave() -> None:
    span = supplementary_maternity_leave(BIRTH, 2, 30, 1200, stays(("2026-11-12", "2026-11-30")), P)
    assert span.start == d("2027-06-17")


def test_merge_stays_counts_each_day_once() -> None:
    merged = merge_stays(
        stays(
            ("2026-11-20", "2026-11-25"), ("2026-11-22", "2026-11-28"), ("2026-11-29", "2026-12-01")
        )
    )
    assert merged == stays(("2026-11-20", "2026-12-01"))


def supplementary_profile(
    child: dict[str, Any], events: list[dict[str, Any]], **kwargs: Any
) -> Any:
    return make_profile(child={"birthDate": "2026-11-12", **child}, events=events, **kwargs)


def test_check_supplementary_yes() -> None:
    profile = supplementary_profile(
        {"gestationalWeeks": 26, "birthWeightG": 800},
        [event_dict("CHILD_HOSPITALIZATION", "2026-11-12", "2027-01-20")],
    )
    decision = check_supplementary_maternity(profile, P, TODAY)
    assert decision.verdict is Verdict.YES
    assert decision.period == (d("2027-04-01"), d("2027-06-09"))
    assert "10 tyg." in decision.summary
    assert "100%" in decision.summary


def test_check_supplementary_ongoing_stay_and_twins_are_assumptions() -> None:
    profile = supplementary_profile(
        {"gestationalWeeks": 27, "childrenCount": 2},
        [
            event_dict("MOTHER_HOSPITALIZATION", "2026-11-12", "2026-11-14"),
            event_dict("CHILD_HOSPITALIZATION", "2026-11-12"),
        ],
    )
    decision = check_supplementary_maternity(profile, P, TODAY)
    assert decision.verdict is Verdict.YES
    assert decision.period is not None
    assert decision.period[1] == d("2027-06-30")  # 11 dni do 22.11 → 2 tyg. po 16.06
    assert any("Pobyt w szpitalu trwa" in a for a in decision.assumptions)
    assert any("Poród mnogi" in a for a in decision.assumptions)


@pytest.mark.parametrize(
    ("child", "events", "missing"),
    [
        ({"birthDate": None, "expectedBirthDate": "2026-12-01"}, [], "child.birthDate"),
        ({}, [], "child.gestationalWeeks"),
        ({"gestationalWeeks": 33}, [], "child.birthWeightG"),
        ({"gestationalWeeks": 39}, [], "specialEvents"),
    ],
)
def test_check_supplementary_need_info(
    child: dict[str, Any], events: list[dict[str, Any]], missing: str
) -> None:
    profile = supplementary_profile(child, events)
    decision = check_supplementary_maternity(profile, P, TODAY)
    assert decision.missing == (missing,)


def test_check_supplementary_no_for_short_term_stay() -> None:
    profile = supplementary_profile(
        {"gestationalWeeks": 39, "birthWeightG": 3400},
        [event_dict("CHILD_HOSPITALIZATION", "2026-11-12", "2026-11-14")],
    )
    decision = check_supplementary_maternity(profile, P, TODAY)
    assert decision.verdict is Verdict.NO
    assert "art. 181 KP" in decision.alternatives[0]


def test_check_supplementary_requires_insurance_at_start() -> None:
    profile = supplementary_profile(
        {"gestationalWeeks": 26},
        [event_dict("CHILD_HOSPITALIZATION", "2026-11-12", "2026-12-20")],
        periods=[period(end="2027-03-31")],
    )
    assert check_supplementary_maternity(profile, P, TODAY).verdict is Verdict.NO


# --- TE-56 / TE-57: zasiłek chorobowy w ciąży i okres zasiłkowy -----------------------


def test_te56_sickness_in_pregnancy_with_code_b_is_100_percent() -> None:
    profile = make_profile(
        child={"expectedBirthDate": "2027-06-01"},
        sick_leaves=[{"dateFrom": "2026-11-02", "dateTo": "2026-11-30", "code": "B"}],
    )
    decision = check_sickness_in_pregnancy(profile, TODAY, P)
    assert decision.verdict is Verdict.YES
    assert "100%" in decision.summary
    assert not decision.warnings


PREGNANT = {"expectedBirthDate": "2027-06-01"}  # ciąża szacunkowo od 25.08.2026
LONG_B = {"dateFrom": "2026-09-01", "dateTo": "2027-05-31", "code": "B"}


def test_te57_day_271_is_outside_benefit_period() -> None:
    profile = make_profile(child=PREGNANT, sick_leaves=[LONG_B])
    decision = check_sickness_period(profile, d("2027-05-29"), P)
    assert decision.verdict is Verdict.NO
    assert "skończył się 28.05.2027" in decision.summary
    assert "świadczenie rehabilitacyjne" in decision.alternatives[0]
    assert any(b.article == "art. 18" for b in decision.legal_basis)


def test_day_270_is_last_day_of_pregnancy_benefit_period() -> None:
    profile = make_profile(child=PREGNANT, sick_leaves=[LONG_B])
    decision = check_sickness_period(profile, d("2027-05-28"), P)
    assert decision.verdict is Verdict.YES
    assert decision.period == (d("2026-09-01"), d("2027-05-28"))
    assert "270. dzień" in decision.summary
    assert "Zostało 0 dni" in decision.summary


def test_general_limit_is_182_days_outside_pregnancy() -> None:
    leaves = [SickLeave(date_from=d("2026-01-01"), date_to=d("2026-12-31"))]
    status = sickness_period_status(leaves, d("2026-07-02"), P)
    assert status is not None
    assert (status.limit, status.used_days, status.exhausted) == (182, 183, True)
    assert status.last_covered_day == d("2026-07-01")
    assert status.remaining == 0


def leave(start: str, end: str, code: str | None = None) -> SickLeave:
    return SickLeave(date_from=d(start), date_to=d(end), code=code)


def test_break_up_to_60_days_joins_periods_regardless_of_cause() -> None:
    status = sickness_period_status(
        [leave("2026-01-01", "2026-01-31"), leave("2026-04-02", "2026-04-10")],
        d("2026-04-10"),
        P,
    )
    assert status is not None
    assert (status.start, status.used_days) == (d("2026-01-01"), 40)  # przerwa dokładnie 60 dni


def test_break_over_60_days_starts_new_period() -> None:
    status = sickness_period_status(
        [leave("2026-01-01", "2026-01-31"), leave("2026-04-03", "2026-04-10")],
        d("2026-04-10"),
        P,
    )
    assert status is not None
    assert (status.start, status.used_days) == (d("2026-04-03"), 8)  # przerwa 61 dni


def test_pregnancy_after_short_break_starts_new_period() -> None:
    pregnancy = (d("2026-08-25"), d("2027-05-31"))
    leaves = [leave("2026-07-01", "2026-07-31"), leave("2026-09-01", "2026-09-30", "B")]
    status = sickness_period_status(leaves, d("2026-09-30"), P, pregnancy=pregnancy)
    assert status is not None
    assert (status.start, status.used_days, status.limit) == (d("2026-09-01"), 30, 270)


def test_continuous_incapacity_into_pregnancy_is_one_period() -> None:
    pregnancy = (d("2026-08-25"), d("2027-05-31"))
    leaves = [leave("2026-08-01", "2026-08-31"), leave("2026-09-01", "2026-09-10")]
    status = sickness_period_status(leaves, d("2026-09-10"), P, pregnancy=pregnancy)
    assert status is not None
    assert (status.start, status.used_days, status.pregnancy) == (d("2026-08-01"), 41, True)


def test_overlapping_leaves_count_days_once() -> None:
    leaves = [
        leave("2026-01-01", "2026-01-20"),
        leave("2026-01-05", "2026-01-10"),  # w całości wewnątrz
        leave("2026-01-15", "2026-01-25"),  # częściowo
        leave("2026-03-01", "2026-03-05"),  # po dniu sprawdzenia
    ]
    status = sickness_period_status(leaves, d("2026-01-25"), P)
    assert status is not None
    assert status.used_days == 25


def test_sickness_period_needs_sick_leaves() -> None:
    assert check_sickness_period(make_profile(), TODAY, P).missing == (
        "applicant.insurance.sickLeaves",
    )
    future = make_profile(sick_leaves=[{"dateFrom": "2027-01-01", "dateTo": "2027-01-10"}])
    assert check_sickness_period(future, TODAY, P).verdict is Verdict.NEED_INFO


def test_sickness_period_without_child_dates_uses_general_limit() -> None:
    profile = make_profile(
        child={}, sick_leaves=[{"dateFrom": "2026-11-01", "dateTo": "2026-11-30"}]
    )
    decision = check_sickness_period(profile, TODAY, P)
    assert decision.verdict is Verdict.YES
    assert "182 dni, zasada ogólna" in decision.summary


# --- T6 / T7: wymiar z tabel ----------------------------------------------------------


def test_t6_twins_with_za_zyciem_use_table_dimensions() -> None:
    params = get_params(BIRTH)
    assert params.maternity_weeks_for(2) == 31
    assert params.parental_weeks_for(2, za_zyciem=True) == 67
    assert maternity_leave(BIRTH, 2, params).end == d("2027-06-16")


def test_t7_stillbirth_gives_8_weeks() -> None:
    span = maternity_leave(BIRTH, 1, P, stillbirth=True)
    assert span.days == 8 * 7
