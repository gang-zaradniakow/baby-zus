"""Punkt wejścia silnika: intencja + profil → karta odpowiedzi (ZUS-19).

``evaluate`` wybiera regułę dla intencji z katalogu i składa kartę przez ``answer_builder``.
Tego samego wejścia używa API (poziom 1) i serwer MCP ``kalkulator`` (poziom 2), więc obie
ścieżki dają te same liczby.

Intencje bez deterministycznej reguły (``LEVEL2_ONLY``) i przypadki poza zakresem silnika
zwracają ``Unsupported`` – zamiast zgadywać werdykt, odpowiedź przechodzi na poziom 2
(baza wiedzy z cytatem) albo do urzędnika. ``Unsupported`` niesie podstawę prawną z rejestru.
"""

import math
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Final

from contracts import (
    AnswerCard,
    Calculation,
    Fact,
    FactSource,
    InsuranceTitle,
    LegalRef,
    ParentRole,
    PeriodType,
    Profile,
    SpecialEventKind,
    Verdict,
)
from rules_engine.answer_builder import EngineAnswer, build_card, need_info_decision
from rules_engine.calculators.contribution_base import ContributionBase, contribution_base
from rules_engine.calculators.leave_periods import (
    LeavePlanError,
    maternity_leave,
    parental_entitlement,
    paternity_deadline,
)
from rules_engine.calculators.maternity import VARIANT_NAMES, calc_maternity
from rules_engine.calculators.parental_split import (
    BASIS_SPLIT,
    BASIS_WORK,
    PARENT_NAMES,
    ParentalPart,
    ParentalPlan,
    calc_parental_split,
)
from rules_engine.catalog import INTENTS_BY_ID
from rules_engine.documents import BenefitKind, DocumentList, required_documents
from rules_engine.eligibility.common import EXPECTED_FIELD, PERIODS_FIELD, insurance_facts
from rules_engine.eligibility.decision import Decision
from rules_engine.eligibility.maternity import check_equivalent_maternity, check_maternity
from rules_engine.eligibility.sickness import PREGNANCY_CODE, check_sickness_in_pregnancy
from rules_engine.eligibility.sickness_period import (
    SICK_LEAVES_FIELD,
    pregnancy_window,
    sickness_period_status,
)
from rules_engine.eligibility.special import (
    check_adoption,
    check_father_takeover,
    check_supplementary_maternity,
)
from rules_engine.formatting import format_date, format_percent, format_pln, money
from rules_engine.insurance import sickness_insured_on
from rules_engine.legal import intent_basis, legal_refs
from rules_engine.outcomes import NeedInfo, OutOfScope
from rules_engine.params import LegalBasis, NoParamsForDateError, ParamSet, get_params
from rules_engine.payer import determine_payer

BIRTH_FIELD: Final = "child.birthDate"
PLACEMENT_FIELD: Final = "child.placement"
EVENTS_FIELD: Final = "specialEvents"
PARTNER_FIELD: Final = "partner"
LEAVE_PLAN_FIELD: Final = "leavePlan"
DAYS_IN_BENEFIT_MONTH: Final = 30

type Outcome = EngineAnswer | Decision | OutOfScope
type Handler = Callable[[Profile, date, ParamSet], Outcome]

LEVEL2_ONLY: Final[dict[str, str]] = {
    "A.05_zasilek_opiekunczy": "zasiłek opiekuńczy – poza zakresem reguł MVP",
    "B.07_zmiana_etatu_w_ciazy": "symulacja zmiany pensji wymaga planowanych kwot",
    "D.06_matka_bez_ubezpieczenia": "uprawnienia ojca przy nieubezpieczonej matce – baza wiedzy",
    "E.02_dzialalnosc_podczas_zasilku": "informacja ogólna – baza wiedzy",
    "E.06_praca_na_zwolnieniu_w_ciazy": "informacja ogólna – baza wiedzy",
    "F.09_poronienie": "zależy od tygodnia ciąży i dokumentów – baza wiedzy lub urzędnik",
    "G.06_status_wniosku": "status sprawy w PUE/eZUS – serwer zus-pue",
    "G.07_akt_urodzenia": "procedura USC – serwer usc",
    "G.08_wniosek_o_urlop": "szablon wniosku – serwer dokumenty",
    "H.01_utrata_prawa": "informacja ogólna – baza wiedzy",
    "H.02_zmiana_zatrudnienia": "symulacja planowanej zmiany – baza wiedzy",
    "H.06_zakwestionowanie_umowy": "ocena ryzyka należy do ZUS – baza wiedzy lub urzędnik",
    "H.07_ochrona_przed_zwolnieniem": "prawo pracy – baza wiedzy (PIP)",
}


@dataclass(frozen=True, slots=True)
class Unsupported:
    """Silnik nie odpowiada na tę intencję deterministycznie – poziom 2 albo urzędnik."""

    intent_id: str
    reason: str
    legal_basis: list[LegalRef]


# --- wspólne -------------------------------------------------------------------------


def anchor(profile: Profile) -> tuple[date, bool] | None:
    """(data zdarzenia, czy nastąpiło): przyjęcie dziecka > poród > przewidywany poród."""
    child = profile.child
    if child.placement is not None:
        return child.placement.placement_date, True
    if child.birth_date is not None:
        return child.birth_date, True
    if child.expected_birth_date is not None:
        return child.expected_birth_date, False
    return None


def params_for(profile: Profile, today: date) -> ParamSet:
    """Zestaw parametrów z dnia zdarzenia (albo z dziś, gdy daty brak)."""
    found = anchor(profile)
    return get_params(found[0] if found else today)


def _need(intent_id: str, summary: str, field: str, facts: tuple[Fact, ...] = ()) -> Decision:
    return Decision(
        verdict=Verdict.NEED_INFO,
        summary=summary,
        missing=(field,),
        facts=facts,
        legal_basis=intent_basis(intent_id),
    )


def _yes(
    intent_id: str,
    summary: str,
    *,
    facts: tuple[Fact, ...] = (),
    legal_basis: tuple[LegalBasis, ...] | None = None,
    warnings: tuple[str, ...] = (),
    assumptions: tuple[str, ...] = (),
) -> Decision:
    return Decision(
        verdict=Verdict.YES,
        summary=summary,
        facts=facts,
        legal_basis=legal_basis or intent_basis(intent_id),
        warnings=warnings,
        assumptions=assumptions,
    )


def _child_facts(profile: Profile) -> tuple[Fact, ...]:
    child = profile.child
    facts = [
        Fact(
            label="Liczba dzieci przy porodzie",
            value=str(child.children_count),
            source=child.source,
        )
    ]
    if child.za_zyciem:
        facts.append(Fact(label="Zaświadczenie „Za życiem”", value="tak", source=child.source))
    return tuple(facts)


def _prediction(happened: bool) -> tuple[str, ...]:
    return () if happened else ("Prognoza – liczona od przewidywanej daty porodu.",)


# --- A: uprawnienia ------------------------------------------------------------------


def _maternity(profile: Profile, today: date, params: ParamSet) -> Outcome:
    return check_maternity(profile)


def _equivalent_maternity(profile: Profile, today: date, params: ParamSet) -> Outcome:
    return check_equivalent_maternity(profile)


def _sickness(profile: Profile, today: date, params: ParamSet) -> Outcome:
    return check_sickness_in_pregnancy(profile, today, params)


def _rehabilitation(profile: Profile, today: date, params: ParamSet) -> Outcome:
    intent_id = "A.03_swiadczenie_rehabilitacyjne"
    status = sickness_period_status(
        profile.applicant.insurance.sick_leaves,
        today,
        params,
        pregnancy=pregnancy_window(profile),
    )
    if status is None:
        return _need(intent_id, "Potrzebuję dat zwolnień lekarskich (e-ZLA).", SICK_LEAVES_FIELD)
    facts = (
        Fact(
            label="Wykorzystany okres zasiłkowy",
            value=f"{status.used_days} z {status.limit} dni",
            source=profile.applicant.insurance.source,
        ),
    )
    if status.exhausted and status.last_covered_day is not None:
        return _yes(
            intent_id,
            f"Tak, warunek jest spełniony – okres zasiłkowy ({status.limit} dni) skończył się "
            f"{format_date(status.last_covered_day)}. Jeśli nadal nie możesz pracować, a "
            "leczenie rokuje powrót do pracy, złóż wniosek o świadczenie rehabilitacyjne – "
            "decyzję podejmuje lekarz orzecznik ZUS.",
            facts=facts,
        )
    return Decision(
        verdict=Verdict.NO,
        summary=f"Jeszcze nie – świadczenie rehabilitacyjne przysługuje dopiero po wyczerpaniu "
        f"zasiłku chorobowego. Zostało {status.remaining} dni okresu zasiłkowego.",
        facts=facts,
        legal_basis=intent_basis(intent_id),
        alternatives=("Do końca okresu zasiłkowego przysługuje zasiłek chorobowy.",),
    )


# --- B: wysokość ---------------------------------------------------------------------


def _maternity_amount(intent_id: str) -> Handler:
    def handler(profile: Profile, today: date, params: ParamSet) -> Outcome:
        eligibility = check_maternity(profile)
        if eligibility.verdict is not Verdict.YES:
            return eligibility
        result = calc_maternity(profile, params, today)
        if isinstance(result, NeedInfo):
            return need_info_decision(result, intent_id, eligibility.facts)
        if isinstance(result, OutOfScope):
            return result
        best = result.recommended
        first = best.periods[0]
        variant = VARIANT_NAMES[best.variant]
        summaries = {
            "B.01_wysokosc_macierzynskiego": f"{variant}: {best.describe()}.",
            "B.03_kwota_miesieczna": f"Miesięcznie dostaniesz {format_pln(first.monthly)} "
            f"brutto ({variant}).",
            "B.06_suma_za_caly_okres": f"Łącznie za cały okres: {format_pln(best.total)} "
            f"brutto ({variant}).",
            "B.04_warianty_urlopu": " ".join(
                f"{VARIANT_NAMES[v.variant]}: {v.describe()}."
                for v in (result.uniform, result.standard)
            ),
        }
        decision = _yes(
            intent_id,
            summaries[intent_id],
            facts=tuple(result.facts()),
            legal_basis=(*eligibility.legal_basis, *result.legal_basis),
            warnings=eligibility.warnings,
        )
        return EngineAnswer(decision, best.to_calculation(result.base, result.assumptions))

    return handler


def _base(
    profile: Profile, day: date, params: ParamSet, intent_id: str
) -> ContributionBase | Outcome:
    outcome = contribution_base(profile.applicant.insurance, day, params)
    if isinstance(outcome, NeedInfo):
        return need_info_decision(outcome, intent_id)
    return outcome


def _contribution_base(profile: Profile, today: date, params: ParamSet) -> Outcome:
    intent_id = "B.05_podstawa_wymiaru"
    found = anchor(profile)
    base = _base(profile, found[0] if found else today, params, intent_id)
    if not isinstance(base, ContributionBase):
        return base
    return _yes(
        intent_id,
        f"Podstawa wymiaru wynosi {format_pln(base.amount)} – to średni miesięczny przychód "
        f"z {len(base.months)} mies. po odliczeniu składek "
        f"({format_percent(base.deduction_rate)}).",
        facts=tuple(base.facts()),
        legal_basis=base.legal_basis,
        assumptions=base.assumptions,
    )


def _sickness_amount(profile: Profile, today: date, params: ParamSet) -> Outcome:
    intent_id = "B.02_wysokosc_chorobowego_w_ciazy"
    decision = check_sickness_in_pregnancy(profile, today, params)
    if decision.verdict is not Verdict.YES:
        return decision
    leaves = sorted(profile.applicant.insurance.sick_leaves, key=lambda leave: leave.date_from)
    latest = leaves[-1] if leaves else None
    if latest is not None and latest.code != PREGNANCY_CODE:
        return decision  # bez kodu B stawka zależy od przyczyny – ostrzeżenie jest w decyzji
    base = _base(profile, latest.date_from if latest else today, params, intent_id)
    if not isinstance(base, ContributionBase):
        return base
    rate = params.rate_sickness_pregnancy.value
    monthly = money(base.amount * rate)
    daily = money(base.amount * rate / DAYS_IN_BENEFIT_MONTH)
    periods = []
    summary = (
        f"Zasiłek chorobowy w ciąży to {format_percent(rate)} podstawy: {format_pln(daily)} "
        f"dziennie, ok. {format_pln(monthly)} miesięcznie."
    )
    if latest is not None:
        days = (latest.date_to - latest.date_from).days + 1
        amount = money(daily * days)
        periods.append(
            {
                "type": PeriodType.CHOROBOWY,
                "from": latest.date_from,
                "to": latest.date_to,
                "rate": rate,
                "amount": amount,
                "monthly": monthly,
            }
        )
        summary += (
            f" Za zwolnienie {format_date(latest.date_from)} – {format_date(latest.date_to)} "
            f"({days} dni): {format_pln(amount)}."
        )
    assumptions = [*base.assumptions]
    if profile.applicant.insurance.periods and any(
        p.title is InsuranceTitle.EMPLOYMENT for p in profile.applicant.insurance.periods
    ):
        assumptions.append(
            f"Za pierwsze {params.employer_sick_pay_days.value} dni niezdolności w roku "
            "pracodawca wypłaca wynagrodzenie chorobowe – w ciąży także 100%."
        )
    calculation = Calculation.model_validate(
        {
            "base": base.amount,
            "rate": rate,
            "periods": periods,
            "monthly": monthly,
            "total": periods[0]["amount"] if periods else None,
            "assumptions": assumptions,
        }
    )
    return EngineAnswer(
        _yes(
            intent_id,
            summary,
            facts=(*decision.facts, *base.facts()),
            legal_basis=(*decision.legal_basis, *base.legal_basis),
        ),
        calculation,
    )


# --- C: okresy i terminy -------------------------------------------------------------


def _maternity_weeks(profile: Profile, today: date, params: ParamSet) -> Outcome:
    intent_id = "C.01_wymiar_macierzynskiego"
    child = profile.child
    birth = child.birth_date or child.expected_birth_date
    if birth is None:
        return _need(
            intent_id, "Kiedy urodziło się dziecko (albo kiedy ma się urodzić)?", EXPECTED_FIELD
        )
    events = {e.kind: e.date_from for e in profile.special_events}
    span = maternity_leave(
        birth,
        child.children_count,
        params,
        stillbirth=SpecialEventKind.STILLBIRTH in events,
        child_death=events.get(SpecialEventKind.CHILD_DEATH),
    )
    return _yes(
        intent_id,
        f"Urlop macierzyński trwa {span.days // 7} tygodni"
        f"{'' if span.days % 7 == 0 else f' i {span.days % 7} dni'}: "
        f"od {format_date(span.start)} do {format_date(span.end)}.",
        facts=_child_facts(profile),
        legal_basis=span.legal_basis,
        assumptions=(*_prediction(child.birth_date is not None), *span.notes),
    )


def _parental_weeks(intent_id: str) -> Handler:
    def handler(profile: Profile, today: date, params: ParamSet) -> Outcome:
        child = profile.child
        za_zyciem = child.za_zyciem or intent_id == "F.07_za_zyciem"
        weeks = params.parental_weeks_for(child.children_count, za_zyciem=za_zyciem)
        exclusive = params.parental_nontransferable_weeks.value
        summary = (
            f"Urlop rodzicielski: {weeks} tygodni łącznie dla obojga rodziców; po {exclusive} "
            "tygodni przysługuje wyłącznie każdemu z nich."
        )
        assumptions: tuple[str, ...] = ()
        if za_zyciem and not child.za_zyciem:
            assumptions = ("Pokazano wymiar przy zaświadczeniu „Za życiem” – nie ma go w profilu.",)
        found = anchor(profile)
        if found is not None:
            deadline = parental_entitlement(found[0], child.children_count, params).deadline
            summary += f" Wykorzystaj go do {format_date(deadline)}."
        return _yes(
            intent_id,
            summary,
            facts=_child_facts(profile),
            assumptions=assumptions,
        )

    return handler


def _total_duration(profile: Profile, today: date, params: ParamSet) -> Outcome:
    child = profile.child
    maternity = params.maternity_weeks_for(child.children_count)
    parental = params.parental_weeks_for(child.children_count, za_zyciem=child.za_zyciem)
    return _yes(
        "C.05_jak_dlugo_swiadczenie",
        f"Zasiłek macierzyński przysługuje łącznie do {maternity + parental} tygodni: "
        f"{maternity} tyg. urlopu macierzyńskiego i {parental} tyg. rodzicielskiego "
        "(rodzicielski dzielą rodzice).",
        facts=_child_facts(profile),
    )


def _multiple_children(intent_id: str) -> Handler:
    def handler(profile: Profile, today: date, params: ParamSet) -> Outcome:
        table = ", ".join(f"{n} – {w}" for n, w in params.maternity_leave_weeks.value)
        summary = (
            f"Urlop macierzyński zależy od liczby dzieci z jednego porodu (dzieci – tygodnie): "
            f"{table} (5 i więcej – {params.maternity_leave_weeks.value[-1][1]}). Rodzicielski: "
            f"{params.parental_leave_weeks_single.value} tyg. przy jednym dziecku, "
            f"{params.parental_leave_weeks_multiple.value} tyg. przy większej liczbie."
        )
        children = profile.child.children_count
        if children > 1:
            summary += (
                f" Przy {children} dzieciach: {params.maternity_weeks_for(children)} + "
                f"{params.parental_weeks_for(children, za_zyciem=profile.child.za_zyciem)} tyg."
            )
        return _yes(intent_id, summary, facts=_child_facts(profile))

    return handler


def _application_deadline(intent_id: str) -> Handler:
    def handler(profile: Profile, today: date, params: ParamSet) -> Outcome:
        found = anchor(profile)
        if found is None:
            return _need(intent_id, "Kiedy urodziło się dziecko?", BIRTH_FIELD)
        day, happened = found
        days = params.uniform_rate_application_days.value
        deadline = day + timedelta(days=days)
        if intent_id == "H.05_spozniony_wniosek":
            summary = (
                f"Jeśli wniosek o urlop rodzicielski złożysz później niż {days} dni po porodzie, "
                f"nie skorzystasz z wariantu {format_percent(params.rate_uniform.value)} – "
                f"zostaje {format_percent(params.rate_maternity.value)} za urlop macierzyński "
                f"i {format_percent(params.rate_parental.value)} za rodzicielski."
            )
        else:
            summary = (
                f"Wniosek o urlop rodzicielski zaraz po macierzyńskim (wariant "
                f"{format_percent(params.rate_uniform.value)}) złóż w ciągu {days} dni po "
                f"porodzie – do {format_date(deadline)}."
            )
        if happened:
            left = (deadline - today).days
            summary += (
                f" Zostało {left} dni." if left >= 0 else f" Termin minął {format_date(deadline)}."
            )
        return _yes(
            intent_id,
            summary,
            facts=(
                Fact(
                    label="Data porodu" if happened else "Przewidywana data porodu",
                    value=format_date(day),
                    source=profile.child.source,
                ),
            ),
            assumptions=_prediction(happened),
        )

    return handler


def _prenatal(profile: Profile, today: date, params: ParamSet) -> Outcome:
    intent_id = "C.07_urlop_przed_porodem"
    child = profile.child
    if child.birth_date is not None:
        return Decision(
            verdict=Verdict.NO,
            summary="Poród już się odbył – urlop przed porodem nie dotyczy Twojej sytuacji.",
            legal_basis=intent_basis(intent_id),
        )
    if child.expected_birth_date is None:
        return _need(intent_id, "Jaka jest przewidywana data porodu?", EXPECTED_FIELD)
    weeks = params.maternity_prenatal_max_weeks.value
    earliest = child.expected_birth_date - timedelta(weeks=weeks)
    return _yes(
        intent_id,
        f"Urlop macierzyński możesz zacząć najwcześniej {format_date(earliest)} – {weeks} "
        f"tygodni przed przewidywaną datą porodu. Część wykorzystana przed porodem skraca "
        f"urlop po porodzie, ale po porodzie masz zawsze co najmniej "
        f"{params.maternity_mandatory_weeks.value} tygodni.",
        facts=(
            Fact(
                label="Przewidywana data porodu",
                value=format_date(child.expected_birth_date),
                source=child.source,
            ),
        ),
    )


def _paternity(profile: Profile, today: date, params: ParamSet) -> Outcome:
    intent_id = "C.08_urlop_ojcowski"
    child = profile.child
    if child.placement is not None:
        if child.placement.ruling_final_date is None:
            return _need(
                intent_id,
                "Kiedy uprawomocniło się postanowienie o przysposobieniu?",
                PLACEMENT_FIELD,
            )
        day = child.placement.ruling_final_date
        deadline = paternity_deadline(
            day, params, adopted_child_birth_date=child.placement.child_birth_date
        )
    elif child.birth_date is not None:
        day = child.birth_date
        deadline = paternity_deadline(day, params)
    else:
        return _need(intent_id, "Kiedy urodziło się dziecko?", BIRTH_FIELD)
    facts = (
        Fact(label="Termin urlopu ojcowskiego", value=format_date(deadline), source=child.source),
    )
    if today > deadline:
        return Decision(
            verdict=Verdict.NO,
            summary=f"Termin na urlop ojcowski minął {format_date(deadline)}.",
            facts=facts,
            legal_basis=intent_basis(intent_id),
            alternatives=("Ojciec może skorzystać z urlopu rodzicielskiego.",),
        )
    return _yes(
        intent_id,
        f"Urlop ojcowski: {params.paternity_leave_days.value} dni, jednorazowo albo w "
        f"{params.paternity_max_parts.value} częściach po co najmniej "
        f"{params.paternity_min_part_days.value} dni – do {format_date(deadline)}. "
        f"Zostało {(deadline - today).days} dni.",
        facts=facts,
    )


def _takeover(profile: Profile, today: date, params: ParamSet) -> Outcome:
    return check_father_takeover(profile, params)


# --- D, E: podział urlopu i praca ----------------------------------------------------


def _plan(
    intent_id: str, profile: Profile, params: ParamSet
) -> tuple[ParentalPlan, date] | Decision:
    found = anchor(profile)
    if found is None:
        return _need(intent_id, "Kiedy urodziło się dziecko?", BIRTH_FIELD)
    parts = [p for p in profile.leave_plan if p.type is PeriodType.RODZICIELSKI]
    if not parts:
        return _need(intent_id, "Jak planujecie podzielić urlop rodzicielski?", LEAVE_PLAN_FIELD)
    parental_parts = [
        ParentalPart(
            p.parent,
            p.date_from,
            math.floor(Decimal((p.date_to - p.date_from).days + 1) * (1 - p.work_fraction) / 7),
            p.work_fraction,
        )
        for p in parts
    ]
    child = profile.child
    entitlement = parental_entitlement(
        found[0], child.children_count, params, za_zyciem=child.za_zyciem
    )
    try:
        return calc_parental_split(parental_parts, entitlement, params), found[0]
    except LeavePlanError as error:
        return Decision(
            verdict=Verdict.NO,
            summary=f"Ten plan nie jest zgodny z przepisami: {error}",
            legal_basis=BASIS_SPLIT + BASIS_WORK,
            alternatives=("Zmień podział – każda część to pełne tygodnie z jednej puli.",),
        )


def _plan_facts(plan: ParentalPlan) -> tuple[Fact, ...]:
    facts = []
    for planned in plan.parts:
        part = planned.part
        work = f", praca {format_percent(part.work_fraction)} etatu" if part.work_fraction else ""
        facts.append(
            Fact(
                label=f"{PARENT_NAMES[part.parent]}: część od {format_date(part.start)}",
                value=f"do {format_date(planned.end)}, {part.weeks} tyg. z puli{work}",
                source=FactSource.USER,
            )
        )
    return tuple(facts)


PLAN_SUMMARIES: Final = {
    "D.02_podzial_rodzicielskiego": "Plan jest zgodny z przepisami.",
    "D.03_jednoczesne_korzystanie": "Tak – możecie korzystać z urlopu jednocześnie; każdy "
    "tydzień każdego z Was zmniejsza wspólną pulę.",
    "D.05_praca_drugiego_rodzica": "Tak – każdy z rodziców może na urlopie rodzicielskim "
    "pracować u swojego pracodawcy najwyżej na ½ etatu.",
    "E.01_praca_na_rodzicielskim": "Tak – na urlopie rodzicielskim możesz pracować u "
    "pracodawcy najwyżej na ½ etatu; urlop wydłuża się wtedy proporcjonalnie.",
    "E.04_laczenie_pracy_z_czescia_urlopu": "Tak – pracę możesz łączyć z wybraną częścią "
    "urlopu rodzicielskiego (najwyżej ½ etatu); ta część wydłuża się proporcjonalnie.",
    "E.05_wydluzenie_urlopu_przy_pracy": "Przy pracy na część etatu urlop wydłuża się "
    "proporcjonalnie do wymiaru pracy.",
}


def _leave_plan(intent_id: str) -> Handler:
    def handler(profile: Profile, today: date, params: ParamSet) -> Outcome:
        planned = _plan(intent_id, profile, params)
        if isinstance(planned, Decision):
            return planned
        plan = planned[0]
        used = sum(plan.weeks_by_parent.values())
        summary = (
            f"{PLAN_SUMMARIES[intent_id]} Plan: {len(plan.parts)} części, wykorzystane "
            f"{used} z {plan.entitlement.total_weeks} tygodni (zostaje {plan.remaining_weeks})."
        )
        extended = [p for p in plan.parts if p.extension_days]
        if intent_id == "E.05_wydluzenie_urlopu_przy_pracy" and extended:
            summary += " " + " ".join(
                f"{PARENT_NAMES[p.part.parent]}: część od {format_date(p.part.start)} "
                f"wydłuża się o {p.extension_days} dni."
                for p in extended
            )
        return _yes(
            intent_id, summary, facts=_plan_facts(plan), legal_basis=BASIS_SPLIT + BASIS_WORK
        )

    return handler


def _plan_amounts(intent_id: str) -> Handler:
    def handler(profile: Profile, today: date, params: ParamSet) -> Outcome:
        planned = _plan(intent_id, profile, params)
        if isinstance(planned, Decision):
            return planned
        plan, event_day = planned
        parents = {profile.applicant.role: (profile.applicant, "applicant.insurance.salaries")}
        if profile.partner is not None:
            parents[profile.partner.role] = (profile.partner, PARTNER_FIELD)
        bases: dict[ParentRole, Decimal] = {}
        facts: list[Fact] = list(_plan_facts(plan))
        assumptions: list[str] = []
        for role in plan.weeks_by_parent:
            if role not in parents:
                return _need(intent_id, "Potrzebuję danych drugiego rodzica.", PARTNER_FIELD)
            parent, field = parents[role]
            base = contribution_base(parent.insurance, event_day, params)
            if not isinstance(base, ContributionBase):
                if isinstance(base, OutOfScope):
                    return base
                return _need(intent_id, base.reason, field)
            bases[role] = base.amount
            facts.append(
                Fact(
                    label=f"Podstawa wymiaru – {PARENT_NAMES[role].lower()}",
                    value=format_pln(base.amount),
                    source=parent.insurance.source,
                )
            )
            assumptions.extend(base.assumptions)
        rate = params.rate_parental.value
        periods = plan.benefit_periods(bases, rate)
        assumptions.append(
            f"Przyjęto stawkę {format_percent(rate)} (wariant 100% + 70%); przy wniosku o "
            f"{format_percent(params.rate_uniform.value)} w ciągu 21 dni po porodzie stawka "
            "jest wyższa."
        )
        total = sum((p.amount for p in periods), Decimal(0))
        summary = (
            "Kwoty zależą od podstawy wymiaru rodzica i wymiaru pracy: "
            + "; ".join(
                f"od {format_date(p.start)} {format_pln(p.monthly)}/mies. "
                f"({format_percent(p.rate)})"
                for p in periods
            )
            + f". Łącznie {format_pln(total)}."
        )
        calculation = Calculation(
            base=bases.get(profile.applicant.role, next(iter(bases.values()))),
            rate=rate,
            periods=[p.to_contract() for p in periods],
            total=total,
            assumptions=list(dict.fromkeys(assumptions)),
        )
        return EngineAnswer(
            _yes(intent_id, summary, facts=tuple(facts), legal_basis=BASIS_SPLIT + BASIS_WORK),
            calculation,
        )

    return handler


def _partner_rights(profile: Profile, today: date, params: ParamSet) -> Outcome:
    intent_id = "D.01_prawa_drugiego_rodzica"
    partner = profile.partner
    if partner is None or not partner.insurance.periods:
        return _need(
            intent_id, "Na jakiej podstawie podlega ubezpieczeniu drugi rodzic?", PARTNER_FIELD
        )
    found = anchor(profile)
    day = found[0] if found else today
    facts = tuple(insurance_facts(partner.insurance, day))
    if not sickness_insured_on(day, partner.insurance.periods):
        return Decision(
            verdict=Verdict.NO,
            summary=f"Nie – w dniu {format_date(day)} drugi rodzic nie ma ubezpieczenia "
            "chorobowego, więc nie dostanie zasiłku za urlop rodzicielski ani ojcowski.",
            facts=facts,
            legal_basis=intent_basis(intent_id),
            alternatives=("Urlop wychowawczy nie wymaga ubezpieczenia chorobowego.",),
        )
    summary = (
        "Tak – drugi rodzic ma ubezpieczenie chorobowe, więc może pobierać zasiłek za urlop "
        f"rodzicielski ({params.parental_nontransferable_weeks.value} tygodni przysługuje "
        "wyłącznie jemu)"
    )
    if partner.role is ParentRole.FATHER:
        summary += f" i za urlop ojcowski ({params.paternity_leave_days.value} dni)"
    return _yes(intent_id, summary + ".", facts=facts)


# --- F: sytuacje szczególne ----------------------------------------------------------


def _adoption(profile: Profile, today: date, params: ParamSet) -> Outcome:
    return check_adoption(profile, params)


def _supplementary(profile: Profile, today: date, params: ParamSet) -> Outcome:
    return check_supplementary_maternity(profile, params, today)


def _loss(profile: Profile, today: date, params: ParamSet) -> Outcome:
    intent_id = "F.06_martwe_urodzenie_smierc_dziecka"
    events = {e.kind: e.date_from for e in profile.special_events}
    stillbirth = events.get(SpecialEventKind.STILLBIRTH)
    death = events.get(SpecialEventKind.CHILD_DEATH)
    if stillbirth is None and death is None:
        return _need(intent_id, "Co się wydarzyło i kiedy?", EVENTS_FIELD)
    birth = profile.child.birth_date or stillbirth
    if birth is None:
        return _need(intent_id, "Kiedy urodziło się dziecko?", BIRTH_FIELD)
    span = maternity_leave(
        birth,
        profile.child.children_count,
        params,
        stillbirth=stillbirth is not None,
        child_death=death,
    )
    return _yes(
        intent_id,
        f"Przysługuje Ci urlop macierzyński od {format_date(span.start)} do "
        f"{format_date(span.end)} ({span.days} dni) z zasiłkiem macierzyńskim "
        f"{format_percent(params.rate_maternity.value)} podstawy.",
        legal_basis=span.legal_basis,
        assumptions=span.notes,
    )


# --- G: formalności ------------------------------------------------------------------


def _documents(
    profile: Profile, today: date, params: ParamSet, intent_id: str
) -> DocumentList | Decision:
    found = anchor(profile)
    if found is not None:
        kind, day = BenefitKind.MATERNITY, found[0]
    elif profile.applicant.insurance.sick_leaves:
        kind = BenefitKind.SICKNESS
        day = max(leave.date_from for leave in profile.applicant.insurance.sick_leaves)
    else:
        return _need(intent_id, "Jaka jest przewidywana data porodu?", EXPECTED_FIELD)
    if not profile.applicant.insurance.periods:
        return _need(intent_id, "Na jakiej podstawie podlegasz ubezpieczeniu?", PERIODS_FIELD)
    result = required_documents(profile, kind, day, params, today)
    if isinstance(result, NeedInfo):
        return need_info_decision(result, intent_id)
    return result


def _documents_card(intent_id: str) -> Handler:
    def handler(profile: Profile, today: date, params: ParamSet) -> Outcome:
        docs = _documents(profile, today, params, intent_id)
        if isinstance(docs, Decision):
            return docs
        source = profile.applicant.insurance.source
        if intent_id == "G.03_jaki_formularz":
            symbols = [d.symbol for d in docs.documents if d.symbol]
            summary = (
                f"Formularze: {', '.join(symbols)}. {docs.where}"
                if symbols
                else f"Nie wypełniasz formularza ZUS – wystarczy wniosek o urlop. {docs.where}"
            )
        else:
            summary = (
                "Przygotuj: "
                + "; ".join(d.name + (f" ({d.symbol})" if d.symbol else "") for d in docs.documents)
                + f". {docs.where}"
            )
        facts = [
            Fact(
                label=d.name,
                value=d.who + (f" – {d.note}" if d.note else ""),
                source=source,
            )
            for d in docs.documents
        ]
        return _yes(
            intent_id,
            summary,
            facts=(*docs.payer.facts, *facts),
            legal_basis=docs.legal_basis,
            warnings=docs.notes,
        )

    return handler


def _payer(intent_id: str) -> Handler:
    def handler(profile: Profile, today: date, params: ParamSet) -> Outcome:
        if not profile.applicant.insurance.periods:
            return _need(intent_id, "Na jakiej podstawie podlegasz ubezpieczeniu?", PERIODS_FIELD)
        if intent_id == "G.02_gdzie_zlozyc_wniosek":
            docs = _documents(profile, today, params, intent_id)
            if isinstance(docs, Decision):
                return docs
            return _yes(
                intent_id, docs.where, facts=docs.payer.facts, legal_basis=docs.payer.legal_basis
            )
        found = anchor(profile)
        payer = determine_payer(profile.applicant.insurance, found[0] if found else today, params)
        if isinstance(payer, NeedInfo):
            return need_info_decision(payer, intent_id)
        return _yes(intent_id, payer.summary, facts=payer.facts, legal_basis=payer.legal_basis)

    return handler


# --- rejestr -------------------------------------------------------------------------

HANDLERS: Final[dict[str, Handler]] = {
    "A.01_prawo_do_macierzynskiego": _maternity,
    "A.02_chorobowy_w_ciazy": _sickness,
    "A.03_swiadczenie_rehabilitacyjne": _rehabilitation,
    "A.04_zasilek_w_wysokosci_macierzynskiego": _equivalent_maternity,
    "A.06_swiadczenia_dzialalnosc": _maternity,
    "A.07_swiadczenia_umowa_zlecenia": _maternity,
    "A.08_bez_ubezpieczenia_chorobowego": _maternity,
    "A.09_zasilek_po_ustaniu_umowy": _maternity,
    "B.01_wysokosc_macierzynskiego": _maternity_amount("B.01_wysokosc_macierzynskiego"),
    "B.02_wysokosc_chorobowego_w_ciazy": _sickness_amount,
    "B.03_kwota_miesieczna": _maternity_amount("B.03_kwota_miesieczna"),
    "B.04_warianty_urlopu": _maternity_amount("B.04_warianty_urlopu"),
    "B.05_podstawa_wymiaru": _contribution_base,
    "B.06_suma_za_caly_okres": _maternity_amount("B.06_suma_za_caly_okres"),
    "C.01_wymiar_macierzynskiego": _maternity_weeks,
    "C.02_wymiar_rodzicielskiego": _parental_weeks("C.02_wymiar_rodzicielskiego"),
    "C.03_przejecie_urlopu_przez_drugiego_rodzica": _takeover,
    "C.04_termin_wniosku": _application_deadline("C.04_termin_wniosku"),
    "C.05_jak_dlugo_swiadczenie": _total_duration,
    "C.06_wiecej_niz_jedno_dziecko": _multiple_children("C.06_wiecej_niz_jedno_dziecko"),
    "C.07_urlop_przed_porodem": _prenatal,
    "C.08_urlop_ojcowski": _paternity,
    "D.01_prawa_drugiego_rodzica": _partner_rights,
    "D.02_podzial_rodzicielskiego": _leave_plan("D.02_podzial_rodzicielskiego"),
    "D.03_jednoczesne_korzystanie": _leave_plan("D.03_jednoczesne_korzystanie"),
    "D.04_wplyw_podzialu_na_kwote": _plan_amounts("D.04_wplyw_podzialu_na_kwote"),
    "D.05_praca_drugiego_rodzica": _leave_plan("D.05_praca_drugiego_rodzica"),
    "D.07_wczesniejsze_przejecie_macierzynskiego": _takeover,
    "E.01_praca_na_rodzicielskim": _leave_plan("E.01_praca_na_rodzicielskim"),
    "E.03_wplyw_pracy_na_kwote": _plan_amounts("E.03_wplyw_pracy_na_kwote"),
    "E.04_laczenie_pracy_z_czescia_urlopu": _leave_plan("E.04_laczenie_pracy_z_czescia_urlopu"),
    "E.05_wydluzenie_urlopu_przy_pracy": _leave_plan("E.05_wydluzenie_urlopu_przy_pracy"),
    "F.01_wczesniak": _supplementary,
    "F.02_hospitalizacja_dziecka": _supplementary,
    "F.03_wiecej_dzieci_przy_porodzie": _multiple_children("F.03_wiecej_dzieci_przy_porodzie"),
    "F.04_rodzice_adopcyjni": _adoption,
    "F.05_rodzina_zastepcza": _adoption,
    "F.06_martwe_urodzenie_smierc_dziecka": _loss,
    "F.07_za_zyciem": _parental_weeks("F.07_za_zyciem"),
    "F.08_matka_w_szpitalu_zmarla_porzucila": _takeover,
    "G.01_jakie_dokumenty": _documents_card("G.01_jakie_dokumenty"),
    "G.02_gdzie_zlozyc_wniosek": _payer("G.02_gdzie_zlozyc_wniosek"),
    "G.03_jaki_formularz": _documents_card("G.03_jaki_formularz"),
    "G.04_termin_dokumentow": _application_deadline("G.04_termin_dokumentow"),
    "G.05_kto_wyplaca": _payer("G.05_kto_wyplaca"),
    "H.03_przerwa_w_ubezpieczeniu": _sickness,
    "H.04_zadluzenie": _maternity,
    "H.05_spozniony_wniosek": _application_deadline("H.05_spozniony_wniosek"),
}


def evaluate(
    intent_id: str, profile: Profile, today: date, *, params: ParamSet | None = None
) -> AnswerCard | Unsupported:
    """Karta odpowiedzi silnika dla intencji albo ``Unsupported`` (poziom 2 / urzędnik)."""
    if intent_id not in INTENTS_BY_ID:
        raise KeyError(f"nieznana intencja: {intent_id}")
    if intent_id in LEVEL2_ONLY:
        return Unsupported(intent_id, LEVEL2_ONLY[intent_id], legal_refs(intent_basis(intent_id)))
    if params is None:
        try:
            params = params_for(profile, today)
        except NoParamsForDateError:
            return Unsupported(
                intent_id,
                "zdarzenie sprzed zakresu parametrów silnika",
                legal_refs(intent_basis(intent_id)),
            )
    outcome = HANDLERS[intent_id](profile, today, params)
    if isinstance(outcome, OutOfScope):
        return Unsupported(
            intent_id,
            outcome.reason,
            legal_refs(outcome.legal_basis or intent_basis(intent_id)),
        )
    return build_card(intent_id, outcome, params)
