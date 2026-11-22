"""Zasiłek macierzyński (A.01, A.08, T4) i zasiłek w wysokości zasiłku macierzyńskiego (A.04, T5).

Zasiłek macierzyński nie wymaga okresu wyczekiwania – liczy się ubezpieczenie chorobowe
w dniu porodu lub przyjęcia dziecka (art. 29). Wyjątki „po ustaniu ubezpieczenia” (art. 30):
- ubezpieczenie ustało w ciąży wskutek upadłości, likwidacji lub śmierci pracodawcy
  → do dnia porodu zasiłek w wysokości zasiłku macierzyńskiego, od porodu zasiłek macierzyński,
- umowa na czas określony przedłużona do dnia porodu (art. 177 § 3 KP).
"""

from datetime import date, timedelta
from typing import Final

from contracts import (
    EmploymentEndReason,
    Fact,
    InsurancePeriod,
    InsuranceTitle,
    Profile,
    Verdict,
)
from rules_engine.eligibility.common import (
    DEBT_FIELD,
    EXPECTED_FIELD,
    PERIODS_FIELD,
    TITLE_NAMES,
    contract_risk_warnings,
    debt_warning,
    estimated_pregnancy_start,
    insurance_facts,
    is_business,
)
from rules_engine.eligibility.decision import Decision
from rules_engine.formatting import format_date
from rules_engine.insurance import periods_on, sickness_insured_on
from rules_engine.params import LegalBasis
from rules_engine.params.base import kp, uz

BASIS_MATERNITY: Final = (uz("art. 29"),)
BASIS_AFTER_TERMINATION: Final = (uz("art. 30"),)
BASIS_DEBT: Final = (uz("art. 49", to_verify=True),)
BASIS_PROLONGATION: Final = (kp("art. 177 § 3"), uz("art. 30"))

EMPLOYER_END_REASONS: Final = frozenset(
    {
        EmploymentEndReason.BANKRUPTCY,
        EmploymentEndReason.LIQUIDATION,
        EmploymentEndReason.EMPLOYER_DEATH,
    }
)
ALTERNATIVES_NO_SICKNESS: Final = (
    "Świadczenie rodzicielskie dla rodziców bez prawa do zasiłku macierzyńskiego – "
    "sprawdź warunki i urząd, który je obecnie wypłaca.",
    "Dobrowolne ubezpieczenie chorobowe (zlecenie, działalność) – przy kolejnym "
    "dziecku daje prawo do zasiłku macierzyńskiego.",
)
PREDICTION: Final = "Prognoza: przy założeniu, że ubezpieczenie będzie trwało do dnia porodu."
NO_OTHER_JOB: Final = "Przyjęto, że pracodawca nie zapewnił innego zatrudnienia."


def _anchor(profile: Profile) -> tuple[date, bool, str] | None:
    """(data zdarzenia, czy już nastąpiło, etykieta)."""
    child = profile.child
    if child.placement is not None:
        return child.placement.placement_date, True, "Data przyjęcia dziecka"
    if child.birth_date is not None:
        return child.birth_date, True, "Data porodu"
    if child.expected_birth_date is not None:
        return child.expected_birth_date, False, "Przewidywana data porodu"
    return None


def _ended_in_pregnancy(profile: Profile, anchor: date) -> InsurancePeriod | None:
    """Ostatni okres pracy zakończony przed zdarzeniem, w czasie ciąży."""
    start = estimated_pregnancy_start(profile)
    ended = [
        p
        for p in profile.applicant.insurance.periods
        if p.date_to is not None and p.date_to < anchor and (start is None or p.date_to >= start)
    ]
    return max(ended, key=lambda p: p.date_to or date.min) if ended else None


def _need_info(
    summary: str,
    missing: str,
    basis: tuple[LegalBasis, ...],
    facts: tuple[Fact, ...] = (),
    warnings: tuple[str, ...] = (),
) -> Decision:
    return Decision(
        verdict=Verdict.NEED_INFO,
        summary=summary,
        missing=(missing,),
        legal_basis=basis,
        facts=facts,
        warnings=warnings,
    )


def check_maternity(profile: Profile) -> Decision:
    """A.01 – czy przysługuje zasiłek macierzyński."""
    insurance = profile.applicant.insurance
    anchor_info = _anchor(profile)
    if anchor_info is None:
        return _need_info(
            "Potrzebuję przewidywanej daty porodu albo daty urodzenia dziecka.",
            EXPECTED_FIELD,
            BASIS_MATERNITY,
        )
    if not insurance.periods:
        return _need_info(
            "Potrzebuję informacji, na jakiej podstawie podlegasz ubezpieczeniu.",
            PERIODS_FIELD,
            BASIS_MATERNITY,
        )

    anchor, happened, label = anchor_info
    facts = (
        Fact(label=label, value=format_date(anchor), source=profile.child.source),
        *insurance_facts(insurance, anchor),
    )
    warnings = contract_risk_warnings(profile)
    assumptions = () if happened else (PREDICTION,)

    if sickness_insured_on(anchor, insurance.periods):
        if is_business(insurance, anchor):
            if insurance.contribution_debt is None:
                return _need_info(
                    "Przy działalności gospodarczej prawo do zasiłku zależy od zadłużenia "
                    "w składkach. Czy masz zaległości w ZUS?",
                    DEBT_FIELD,
                    BASIS_MATERNITY + BASIS_DEBT,
                    facts=facts,
                )
            warning = debt_warning(insurance)
            if warning:
                return _need_info(
                    "Masz zadłużenie w składkach – zasiłek będzie wypłacony dopiero po jego "
                    "spłacie. Czy zadłużenie zostało już spłacone?",
                    DEBT_FIELD,
                    BASIS_MATERNITY + BASIS_DEBT,
                    facts=facts,
                    warnings=(warning, *warnings),
                )
        return Decision(
            verdict=Verdict.YES,
            summary=f"Tak – w dniu {format_date(anchor)} masz ubezpieczenie chorobowe, "
            "więc przysługuje Ci zasiłek macierzyński. Nie obowiązuje okres wyczekiwania.",
            facts=facts,
            legal_basis=BASIS_MATERNITY,
            warnings=warnings,
            assumptions=assumptions,
        )

    ended = _ended_in_pregnancy(profile, anchor)
    if ended is not None and ended.title is InsuranceTitle.EMPLOYMENT:
        if ended.end_reason in EMPLOYER_END_REASONS:
            return Decision(
                verdict=Verdict.YES,
                summary="Tak – umowa o pracę ustała w ciąży z przyczyn leżących po stronie "
                "pracodawcy, więc od dnia porodu przysługuje Ci zasiłek macierzyński "
                "(wypłaca ZUS). Do porodu – zasiłek w wysokości zasiłku macierzyńskiego.",
                facts=facts,
                legal_basis=BASIS_AFTER_TERMINATION,
                warnings=warnings,
                assumptions=(*assumptions, NO_OTHER_JOB),
            )
        if ended.end_reason is EmploymentEndReason.CONTRACT_EXPIRY:
            return _need_info(
                f"Umowa na czas określony skończyła się {format_date(ended.date_to or anchor)}. "
                "Jeśli została przedłużona do dnia porodu, zasiłek przysługuje – "
                "czy pracodawca przedłużył umowę?",
                PERIODS_FIELD,
                BASIS_PROLONGATION,
                facts=facts,
            )

    if periods_on(anchor, insurance.periods):
        titles = ", ".join(TITLE_NAMES[p.title] for p in periods_on(anchor, insurance.periods))
        return Decision(
            verdict=Verdict.NO,
            summary=f"Nie – masz tytuł ubezpieczenia ({titles}), ale bez ubezpieczenia "
            "chorobowego, a zasiłek macierzyński wymaga ubezpieczenia chorobowego.",
            facts=facts,
            legal_basis=BASIS_MATERNITY,
            alternatives=ALTERNATIVES_NO_SICKNESS,
            assumptions=assumptions,
        )
    return Decision(
        verdict=Verdict.NO,
        summary=f"Nie – w dniu {format_date(anchor)} nie masz ubezpieczenia chorobowego, "
        "a umowa nie ustała z przyczyn, które zachowują prawo do zasiłku.",
        facts=facts,
        legal_basis=BASIS_MATERNITY + BASIS_AFTER_TERMINATION,
        alternatives=ALTERNATIVES_NO_SICKNESS[:1],
        assumptions=assumptions,
    )


def check_equivalent_maternity(profile: Profile) -> Decision:
    """A.04 – zasiłek w wysokości zasiłku macierzyńskiego do dnia porodu (art. 30 ust. 3)."""
    anchor_info = _anchor(profile)
    if anchor_info is None or profile.child.placement is not None:
        return _need_info(
            "Potrzebuję przewidywanej daty porodu albo daty urodzenia dziecka.",
            EXPECTED_FIELD,
            BASIS_AFTER_TERMINATION,
        )
    anchor = anchor_info[0]
    ended = _ended_in_pregnancy(profile, anchor)
    if (
        ended is None
        or ended.title is not InsuranceTitle.EMPLOYMENT
        or ended.end_reason not in EMPLOYER_END_REASONS
        or ended.date_to is None
    ):
        return Decision(
            verdict=Verdict.NO,
            summary="Nie – ten zasiłek przysługuje tylko, gdy umowa o pracę ustała w ciąży "
            "z powodu upadłości, likwidacji albo śmierci pracodawcy.",
            facts=tuple(insurance_facts(profile.applicant.insurance, anchor)),
            legal_basis=BASIS_AFTER_TERMINATION,
        )
    start, end = ended.date_to + timedelta(days=1), anchor - timedelta(days=1)
    return Decision(
        verdict=Verdict.YES,
        summary=f"Tak – od {format_date(start)} do dnia porodu przysługuje Ci zasiłek "
        "w wysokości zasiłku macierzyńskiego (100% podstawy), wypłaca ZUS.",
        facts=(
            Fact(
                label="Ustanie umowy o pracę",
                value=format_date(ended.date_to),
                source=profile.applicant.insurance.source,
            ),
            Fact(
                label=anchor_info[2],
                value=format_date(anchor),
                source=profile.child.source,
            ),
        ),
        legal_basis=BASIS_AFTER_TERMINATION,
        period=(start, end),
        assumptions=(NO_OTHER_JOB,) if anchor_info[1] else (NO_OTHER_JOB, PREDICTION),
    )
