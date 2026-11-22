"""Uprawnienia w sytuacjach szczególnych (ZUS-18, kategoria F) jako ``Decision``.

- F.04/F.05 – urlop na warunkach urlopu macierzyńskiego przy przysposobieniu i w rodzinie
  zastępczej (T10),
- F.08 – przejęcie urlopu macierzyńskiego przez ojca (T8),
- F.01/F.02 – uzupełniający urlop macierzyński (wcześniak, hospitalizacja dziecka).

Kalkulacja dat jest w ``calculators.special_leaves``; tu – dane z profilu, NEED_INFO,
sprawdzenie ubezpieczenia i treść decyzji.
"""

from datetime import date
from typing import Final

from contracts import Fact, FactSource, PlacementKind, Profile, SpecialEventKind, Verdict
from rules_engine.calculators.leave_periods import LeavePlanError, LeaveSpan
from rules_engine.calculators.special_leaves import (
    BASIS_ADOPTION,
    BASIS_SUPPLEMENTARY,
    BASIS_TAKEOVER,
    PLACEMENT_NAMES,
    TAKEOVER_EVENTS,
    HospitalStay,
    adoption_leave,
    father_takeover_leave,
    supplementary_maternity_leave,
)
from rules_engine.eligibility.common import PERIODS_FIELD, insurance_facts
from rules_engine.eligibility.decision import Decision
from rules_engine.formatting import format_date, format_percent
from rules_engine.insurance import sickness_insured_on
from rules_engine.params import LegalBasis, ParamSet

PLACEMENT_FIELD: Final = "child.placement"
BIRTH_FIELD: Final = "child.birthDate"
EVENTS_FIELD: Final = "specialEvents"
GESTATION_FIELD: Final = "child.gestationalWeeks"
WEIGHT_FIELD: Final = "child.birthWeightG"

EVENT_NAMES: Final = {
    SpecialEventKind.MOTHER_HOSPITALIZATION: "Pobyt matki w szpitalu",
    SpecialEventKind.MOTHER_DEATH: "Zgon matki",
    SpecialEventKind.CHILD_ABANDONMENT: "Porzucenie dziecka przez matkę",
    SpecialEventKind.MOTHER_UNABLE_TO_CARE: "Rezygnacja matki z orzeczeniem o niezdolności "
    "do samodzielnej egzystencji",
}
PLACEMENT_ASSUMPTIONS: Final = {
    PlacementKind.ADOPTION: ("Przyjęto, że złożono wniosek do sądu o przysposobienie dziecka.",),
    PlacementKind.FOSTER_FAMILY: (
        "Dotyczy rodziny zastępczej niezawodowej – rodzinie zawodowej urlop nie przysługuje.",
    ),
}
NOT_INSURED: Final = (
    "Zasiłek za ten okres wymaga ubezpieczenia chorobowego w dniu rozpoczęcia urlopu."
)


def _need_info(summary: str, field: str, basis: tuple[LegalBasis, ...]) -> Decision:
    return Decision(verdict=Verdict.NEED_INFO, summary=summary, missing=(field,), legal_basis=basis)


def _not_insured(profile: Profile, span: LeaveSpan, what: str) -> Decision | None:
    insurance = profile.applicant.insurance
    if not insurance.periods:
        return _need_info(
            "Potrzebuję informacji, na jakiej podstawie podlegasz ubezpieczeniu.",
            PERIODS_FIELD,
            span.legal_basis,
        )
    if sickness_insured_on(span.start, insurance.periods):
        return None
    return Decision(
        verdict=Verdict.NO,
        summary=f"Nie – w dniu {format_date(span.start)} nie masz ubezpieczenia "
        f"chorobowego, więc zasiłek za {what} nie przysługuje.",
        facts=tuple(insurance_facts(insurance, span.start)),
        legal_basis=span.legal_basis,
        alternatives=(NOT_INSURED,),
    )


def _span_fact(label: str, span: LeaveSpan, source: FactSource) -> Fact:
    return Fact(
        label=label,
        value=f"{format_date(span.start)} – {format_date(span.end)} ({span.days} dni)",
        source=source,
    )


# --- F.04 / F.05 – przysposobienie i rodzina zastępcza --------------------------------


def check_adoption(profile: Profile, params: ParamSet) -> Decision:
    """T10: urlop (zasiłek) na warunkach urlopu macierzyńskiego po przyjęciu dziecka."""
    placement = profile.child.placement
    if placement is None:
        return _need_info(
            "Potrzebuję daty przyjęcia dziecka i jego daty urodzenia.",
            PLACEMENT_FIELD,
            BASIS_ADOPTION,
        )
    name = PLACEMENT_NAMES[placement.kind]
    facts = [
        Fact(label="Forma przyjęcia dziecka", value=name, source=profile.child.source),
        Fact(
            label="Data urodzenia dziecka",
            value=format_date(placement.child_birth_date),
            source=profile.child.source,
        ),
        Fact(
            label="Data przyjęcia dziecka",
            value=format_date(placement.placement_date),
            source=profile.child.source,
        ),
    ]
    try:
        span = adoption_leave(
            placement.kind,
            placement.child_birth_date,
            placement.placement_date,
            profile.child.children_count,
            params,
            school_deferral=placement.school_deferral,
        )
    except LeavePlanError as error:
        return Decision(
            verdict=Verdict.NO,
            summary=f"Nie – {error}",
            facts=tuple(facts),
            legal_basis=BASIS_ADOPTION,
            alternatives=(
                "Urlop wychowawczy i urlop rodzicielski mają inne granice wieku dziecka – "
                "zapytaj o nie osobno.",
            ),
        )
    blocked = _not_insured(profile, span, "urlop na warunkach urlopu macierzyńskiego")
    if blocked is not None:
        return blocked
    rate = params.rate_maternity.value
    facts.append(_span_fact("Urlop na warunkach urlopu macierzyńskiego", span, FactSource.USER))
    return Decision(
        verdict=Verdict.YES,
        summary=f"Tak – przysługuje Ci urlop na warunkach urlopu macierzyńskiego "
        f"({name}) od {format_date(span.start)} do {format_date(span.end)}, "
        f"z zasiłkiem {format_percent(rate)} podstawy. Potem możesz skorzystać z urlopu "
        "rodzicielskiego.",
        facts=tuple(facts),
        legal_basis=span.legal_basis,
        assumptions=(*PLACEMENT_ASSUMPTIONS[placement.kind], *span.notes),
        period=(span.start, span.end),
    )


# --- F.08 – przejęcie urlopu przez ojca -----------------------------------------------


def check_father_takeover(profile: Profile, params: ParamSet) -> Decision:
    """T8: część urlopu macierzyńskiego dla ojca (szpital, zgon, porzucenie, niezdolność)."""
    events = [e for e in profile.special_events if e.kind in TAKEOVER_EVENTS]
    if not events:
        return _need_info(
            "Co się stało z mamą dziecka: pobyt w szpitalu, zgon, porzucenie dziecka czy "
            "orzeczenie o niezdolności do samodzielnej egzystencji? Podaj daty.",
            EVENTS_FIELD,
            BASIS_TAKEOVER[SpecialEventKind.MOTHER_HOSPITALIZATION],
        )
    event = max(events, key=lambda e: e.date_from)
    birth = profile.child.birth_date
    if birth is None:
        return _need_info(
            "Potrzebuję daty urodzenia dziecka.", BIRTH_FIELD, BASIS_TAKEOVER[event.kind]
        )
    when = format_date(event.date_from) + (
        f" – {format_date(event.date_to)}" if event.date_to else ""
    )
    facts = [
        Fact(label="Data urodzenia dziecka", value=format_date(birth), source=profile.child.source),
        Fact(label=EVENT_NAMES[event.kind], value=when, source=FactSource.USER),
    ]
    try:
        span = father_takeover_leave(birth, profile.child.children_count, event, params)
    except LeavePlanError as error:
        return Decision(
            verdict=Verdict.NO,
            summary=f"Nie – {error}",
            facts=tuple(facts),
            legal_basis=BASIS_TAKEOVER[event.kind],
            alternatives=(
                "Ojciec może skorzystać z urlopu ojcowskiego (2 tygodnie) i z urlopu "
                "rodzicielskiego.",
            ),
        )
    blocked = _not_insured(profile, span, "przejętą część urlopu macierzyńskiego")
    if blocked is not None:
        return blocked
    facts.append(_span_fact("Część urlopu macierzyńskiego dla ojca", span, FactSource.USER))
    return Decision(
        verdict=Verdict.YES,
        summary=f"Tak – ojciec może przejąć urlop macierzyński od {format_date(span.start)} "
        f"do {format_date(span.end)} ({span.days} dni), z zasiłkiem macierzyńskim.",
        facts=tuple(facts),
        legal_basis=span.legal_basis,
        assumptions=(
            "Przyjęto, że matka nie korzystała z urlopu przed porodem.",
            *span.notes,
        ),
        period=(span.start, span.end),
    )


# --- F.01 / F.02 – uzupełniający urlop macierzyński -----------------------------------


def hospital_stays(profile: Profile, until: date) -> tuple[list[HospitalStay], bool]:
    """Pobyty dziecka w szpitalu; trwający pobyt (bez daty wypisu) liczymy do ``until``."""
    stays, ongoing = [], False
    for event in profile.special_events:
        if event.kind is SpecialEventKind.CHILD_HOSPITALIZATION:
            ongoing = ongoing or event.date_to is None
            stays.append(HospitalStay(event.date_from, event.date_to or until))
    return stays, ongoing


def check_supplementary_maternity(profile: Profile, params: ParamSet, today: date) -> Decision:
    """F.01/F.02: uzupełniający urlop macierzyński (100% podstawy) po urlopie macierzyńskim."""
    child = profile.child
    if child.birth_date is None:
        return _need_info("Kiedy urodziło się dziecko?", BIRTH_FIELD, BASIS_SUPPLEMENTARY)
    if child.gestational_weeks is None:
        return _need_info(
            "W którym tygodniu ciąży urodziło się dziecko?", GESTATION_FIELD, BASIS_SUPPLEMENTARY
        )
    criteria = params.supplementary_maternity_criteria
    if (
        child.birth_weight_g is None
        and criteria is not None
        and criteria.value.very_preterm_weeks <= child.gestational_weeks < criteria.value.term_weeks
    ):
        return _need_info(
            "Jaka była masa urodzeniowa dziecka (w gramach)?", WEIGHT_FIELD, BASIS_SUPPLEMENTARY
        )
    stays, ongoing = hospital_stays(profile, today)
    if not stays:
        return _need_info(
            "Czy dziecko przebywało w szpitalu po porodzie? Podaj daty pobytu.",
            EVENTS_FIELD,
            BASIS_SUPPLEMENTARY,
        )
    facts = [
        Fact(
            label="Data urodzenia dziecka", value=format_date(child.birth_date), source=child.source
        ),
        Fact(
            label="Tydzień ciąży przy porodzie",
            value=f"ukończone {child.gestational_weeks} tyg.",
            source=child.source,
        ),
    ]
    if child.birth_weight_g is not None:
        facts.append(
            Fact(label="Masa urodzeniowa", value=f"{child.birth_weight_g} g", source=child.source)
        )
    try:
        span = supplementary_maternity_leave(
            child.birth_date,
            child.children_count,
            child.gestational_weeks,
            child.birth_weight_g,
            stays,
            params,
        )
    except LeavePlanError as error:
        return Decision(
            verdict=Verdict.NO,
            summary=f"Nie – {error}",
            facts=tuple(facts),
            legal_basis=BASIS_SUPPLEMENTARY,
            alternatives=(
                "Przy pobycie dziecka w szpitalu matka może po 8 tygodniach przerwać urlop "
                "macierzyński i dokończyć go po wypisie (art. 181 KP).",
            ),
        )
    blocked = _not_insured(profile, span, "uzupełniający urlop macierzyński")
    if blocked is not None:
        return blocked
    rate = params.rate_supplementary_maternity
    rate_text = format_percent(rate.value) if rate is not None else "100%"
    facts.append(_span_fact("Uzupełniający urlop macierzyński", span, FactSource.USER))
    assumptions = list(span.notes)
    if ongoing:
        assumptions.append(
            f"Pobyt w szpitalu trwa – policzono do {format_date(today)}; wymiar może wzrosnąć."
        )
    if child.children_count > 1:
        assumptions.append(
            "Poród mnogi: przyjęto najmniejszą masę urodzeniową i łączne pobyty dzieci "
            "(do potwierdzenia w ZUS)."
        )
    return Decision(
        verdict=Verdict.YES,
        summary=f"Tak – przysługuje uzupełniający urlop macierzyński od "
        f"{format_date(span.start)} do {format_date(span.end)} ({span.days // 7} tyg.), "
        f"z zasiłkiem {rate_text} podstawy.",
        facts=tuple(facts),
        legal_basis=span.legal_basis,
        assumptions=tuple(assumptions),
        period=(span.start, span.end),
    )
