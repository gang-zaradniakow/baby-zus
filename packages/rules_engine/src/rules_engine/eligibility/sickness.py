"""Zasiłek chorobowy w ciąży (A.02, H.03, T2).

- okres wyczekiwania: 30 dni (ubezpieczenie obowiązkowe) albo 90 dni (dobrowolne), art. 4,
- do okresu wlicza się poprzednie okresy, jeśli przerwa nie przekroczyła 30 dni,
- w ciąży zasiłek wynosi 100% podstawy, gdy zwolnienie ma kod „B” (art. 11).

Nie uwzględniamy wyjątków od okresu wyczekiwania (art. 4 ust. 3, np. absolwenci, wypadek
w drodze do pracy, 10 lat ubezpieczenia obowiązkowego) – przy werdykcie NO mówimy o nich
w ostrzeżeniu i proponujemy kontakt z ZUS.
"""

from datetime import date, timedelta
from typing import Final

from contracts import Fact, Profile, SicknessInsurance, Verdict
from rules_engine.eligibility.common import (
    DEBT_FIELD,
    PERIODS_FIELD,
    SICKNESS_NAMES,
    debt_warning,
    insurance_facts,
    is_business,
)
from rules_engine.eligibility.decision import Decision
from rules_engine.formatting import format_date, format_percent
from rules_engine.insurance import insured_days_before, sickness_kind_on
from rules_engine.params import ParamSet
from rules_engine.params.base import uz

BASIS_WAITING: Final = (uz("art. 4"),)
BASIS_PREGNANCY_RATE: Final = (uz("art. 11"),)
BASIS_AFTER_TERMINATION: Final = (uz("art. 7", to_verify=True),)
PREGNANCY_CODE: Final = "B"

WAITING_EXCEPTIONS: Final = (
    "Okres wyczekiwania nie obowiązuje m.in. absolwentów (ubezpieczenie w ciągu 90 dni od "
    "ukończenia szkoły), przy wypadku w drodze do pracy i przy 10-letnim ubezpieczeniu "
    "obowiązkowym – jeśli to Twój przypadek, zapytaj urzędnika."
)
AFTER_TERMINATION: Final = (
    "Jeśli niezdolność do pracy zaczęła się najpóźniej 14 dni po ustaniu ubezpieczenia "
    "i trwa co najmniej 30 dni, zasiłek może przysługiwać po ustaniu ubezpieczenia."
)


def _incapacity_date(profile: Profile, today: date) -> tuple[date, bool]:
    """(dzień niezdolności, czy z e-ZLA). Bez e-ZLA – symulacja „gdybyś zachorowała dziś”."""
    leaves = profile.applicant.insurance.sick_leaves
    if leaves:
        return max(leave.date_from for leave in leaves), True
    return today, False


def check_sickness_in_pregnancy(profile: Profile, today: date, params: ParamSet) -> Decision:
    """A.02 – czy przysługuje zasiłek chorobowy w ciąży."""
    insurance = profile.applicant.insurance
    if not insurance.periods:
        return Decision(
            verdict=Verdict.NEED_INFO,
            summary="Potrzebuję informacji, na jakiej podstawie podlegasz ubezpieczeniu.",
            missing=(PERIODS_FIELD,),
            legal_basis=BASIS_WAITING,
        )

    day, from_ezla = _incapacity_date(profile, today)
    assumptions = (
        () if from_ezla else (f"Brak e-ZLA – sprawdzono sytuację na dzień {format_date(day)}.",)
    )
    facts: list[Fact] = list(insurance_facts(insurance, day))
    kind = sickness_kind_on(day, insurance.periods)
    days = insured_days_before(day, insurance.periods)

    if days is None or kind is SicknessInsurance.NONE:
        return Decision(
            verdict=Verdict.NO,
            summary=f"Nie – w dniu {format_date(day)} nie masz ubezpieczenia chorobowego.",
            facts=tuple(facts),
            legal_basis=BASIS_WAITING + BASIS_AFTER_TERMINATION,
            alternatives=(AFTER_TERMINATION,),
            assumptions=assumptions,
        )

    if is_business(insurance, day):
        warning = debt_warning(insurance)
        if insurance.contribution_debt is None or warning:
            return Decision(
                verdict=Verdict.NEED_INFO,
                summary="Przy działalności gospodarczej zasiłek zależy od zadłużenia w "
                "składkach. Czy masz zaległości w ZUS (i czy są spłacone)?",
                missing=(DEBT_FIELD,),
                facts=tuple(facts),
                legal_basis=(*BASIS_WAITING, uz("art. 49", to_verify=True)),
                warnings=(warning,) if warning else (),
            )

    required = (
        params.waiting_period_mandatory_days
        if kind is SicknessInsurance.MANDATORY
        else params.waiting_period_voluntary_days
    ).value
    facts.append(
        Fact(
            label="Okres ubezpieczenia chorobowego przed niezdolnością",
            value=f"{days} dni (wymagane {required} – ubezpieczenie {SICKNESS_NAMES[kind]})",
            source=insurance.source,
        )
    )

    if days < required:
        from_day = day + timedelta(days=required - days)
        return Decision(
            verdict=Verdict.NO,
            summary=f"Nie – masz {days} dni ubezpieczenia chorobowego, a potrzeba "
            f"{required}. Prawo do zasiłku chorobowego powstanie od {format_date(from_day)}.",
            facts=tuple(facts),
            legal_basis=BASIS_WAITING,
            warnings=(WAITING_EXCEPTIONS,),
            alternatives=("Zasiłek macierzyński po porodzie nie wymaga okresu wyczekiwania.",),
            assumptions=assumptions,
        )

    warnings: tuple[str, ...] = ()
    codes = {leave.code for leave in insurance.sick_leaves}
    if from_ezla and PREGNANCY_CODE not in codes:
        warnings = (
            "Zwolnienie nie ma kodu „B”. Zasiłek 100% w ciąży przysługuje, gdy lekarz wpisze "
            "kod B – poproś lekarza o korektę, jeśli niezdolność wynika z ciąży.",
        )
    rate = params.rate_sickness_pregnancy.value
    return Decision(
        verdict=Verdict.YES,
        summary=f"Tak – okres wyczekiwania jest spełniony ({days} z {required} dni). "
        f"Zasiłek chorobowy w ciąży wynosi {format_percent(rate)} podstawy wymiaru.",
        facts=tuple(facts),
        legal_basis=BASIS_WAITING + BASIS_PREGNANCY_RATE,
        warnings=warnings,
        assumptions=assumptions,
    )
