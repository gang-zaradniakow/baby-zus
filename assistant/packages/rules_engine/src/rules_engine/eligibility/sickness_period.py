"""Okres zasiłkowy (A.03, F – choroba w ciąży): 182 dni, w ciąży 270 dni (art. 8).

Zasady (art. 9 ustawy zasiłkowej):
- do okresu wlicza się poprzednie niezdolności, jeśli przerwa między nimi nie przekroczyła
  60 dni – bez względu na przyczynę,
- wyjątek: nie wlicza się niezdolności sprzed przerwy ≤ 60 dni, jeśli po przerwie
  niezdolność wystąpiła w trakcie ciąży (przyjmujemy – jeśli wcześniejsza nie była w ciąży),
- po wyczerpaniu okresu zasiłkowego można ubiegać się o świadczenie rehabilitacyjne.

Uproszczenia: nie odliczamy dni z okresu wyczekiwania (art. 9 ust. 3) ani niezdolności
po ustaniu ubezpieczenia (91 dni) – mówimy o tym w założeniach.
"""

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Final

from contracts import Fact, Profile, SickLeave, Verdict
from rules_engine.eligibility.common import estimated_pregnancy_start
from rules_engine.eligibility.decision import Decision
from rules_engine.eligibility.sickness import PREGNANCY_CODE
from rules_engine.formatting import format_date
from rules_engine.params import ParamSet
from rules_engine.params.base import uz

BASIS_PERIOD: Final = (uz("art. 8"), uz("art. 9"))
BASIS_REHABILITATION: Final = (uz("art. 18"),)
SICK_LEAVES_FIELD: Final = "applicant.insurance.sickLeaves"

ASSUMPTIONS: Final = (
    "Okres zasiłkowy liczony z zwolnień e-ZLA w profilu; nie odliczono dni z okresu "
    "wyczekiwania ani okresów po ustaniu ubezpieczenia.",
    "Zwolnienie uznajemy za przypadające w ciąży, gdy ma kod B albo zaczęło się w szacowanym "
    "okresie ciąży (280 dni przed porodem).",
)
REHABILITATION: Final = (
    "Po wyczerpaniu okresu zasiłkowego możesz złożyć wniosek o świadczenie rehabilitacyjne "
    "(do 12 miesięcy), jeśli dalsze leczenie lub rehabilitacja rokują odzyskanie "
    "zdolności do pracy."
)


@dataclass(frozen=True, slots=True)
class SicknessPeriodStatus:
    start: date
    """Pierwszy dzień bieżącego okresu zasiłkowego."""
    used_days: int
    """Dni wliczone do okresu do ``on_day`` włącznie."""
    limit: int
    pregnancy: bool
    last_covered_day: date | None
    """Ostatni dzień w granicach okresu zasiłkowego; ``None`` – jeszcze nie wyczerpany."""

    @property
    def remaining(self) -> int:
        return max(self.limit - self.used_days, 0)

    @property
    def exhausted(self) -> bool:
        return self.used_days > self.limit


def _in_pregnancy(leave: SickLeave, pregnancy: tuple[date, date] | None) -> bool:
    if leave.code == PREGNANCY_CODE:
        return True
    return pregnancy is not None and pregnancy[0] <= leave.date_from <= pregnancy[1]


def current_chain(
    leaves: Sequence[SickLeave],
    on_day: date,
    params: ParamSet,
    pregnancy: tuple[date, date] | None,
) -> list[tuple[date, date, bool]]:
    """Niezdolności tworzące bieżący okres zasiłkowy: (od, do ≤ on_day, w ciąży)."""
    max_break = params.sickness_period_max_break_days.value
    chain: list[tuple[date, date, bool]] = []
    for leave in sorted(leaves, key=lambda item: item.date_from):
        if leave.date_from > on_day:
            break
        in_pregnancy = _in_pregnancy(leave, pregnancy)
        start, end = leave.date_from, min(leave.date_to, on_day)
        if chain:
            prev_end, prev_pregnancy = chain[-1][1], chain[-1][2]
            if end <= prev_end:  # w całości pokrywa się z poprzednim zwolnieniem
                continue
            gap = (start - prev_end).days - 1
            if gap > max_break or (gap > 0 and in_pregnancy and not prev_pregnancy):
                chain = []
            else:
                start = max(start, prev_end + timedelta(days=1))
        chain.append((start, end, in_pregnancy))
    return chain


def sickness_period_status(
    leaves: Sequence[SickLeave],
    on_day: date,
    params: ParamSet,
    *,
    pregnancy: tuple[date, date] | None = None,
) -> SicknessPeriodStatus | None:
    """Stan okresu zasiłkowego na ``on_day``; ``None`` – brak zwolnień do tego dnia."""
    chain = current_chain(leaves, on_day, params, pregnancy)
    if not chain:
        return None
    in_pregnancy = chain[-1][2]
    limit = (
        params.sickness_period_pregnancy_days if in_pregnancy else params.sickness_period_days
    ).value
    used, last_covered = 0, None
    for start, end, _ in chain:
        days = (end - start).days + 1
        if last_covered is None and used + days >= limit:
            last_covered = start + timedelta(days=limit - used - 1)
        used += days
    return SicknessPeriodStatus(chain[0][0], used, limit, in_pregnancy, last_covered)


def pregnancy_window(profile: Profile) -> tuple[date, date] | None:
    start = estimated_pregnancy_start(profile)
    reference = profile.child.birth_date or profile.child.expected_birth_date
    if start is None or reference is None:
        return None
    return start, reference - timedelta(days=1)


def check_sickness_period(profile: Profile, on_day: date, params: ParamSet) -> Decision:
    """Czy ``on_day`` mieści się w okresie zasiłkowym (A.03 / F – choroba w ciąży)."""
    leaves = profile.applicant.insurance.sick_leaves
    status = sickness_period_status(leaves, on_day, params, pregnancy=pregnancy_window(profile))
    if status is None:
        return Decision(
            verdict=Verdict.NEED_INFO,
            summary="Potrzebuję dat zwolnień lekarskich (e-ZLA), żeby policzyć okres zasiłkowy.",
            missing=(SICK_LEAVES_FIELD,),
            legal_basis=BASIS_PERIOD,
        )
    source = profile.applicant.insurance.source
    kind = "w ciąży" if status.pregnancy else "zasada ogólna"
    facts = (
        Fact(label="Początek okresu zasiłkowego", value=format_date(status.start), source=source),
        Fact(
            label="Wykorzystane dni okresu zasiłkowego",
            value=f"{status.used_days} z {status.limit} ({kind})",
            source=source,
        ),
    )
    if status.exhausted and status.last_covered_day is not None:
        return Decision(
            verdict=Verdict.NO,
            summary=f"Nie – okres zasiłkowy ({status.limit} dni) skończył się "
            f"{format_date(status.last_covered_day)}. Za {format_date(on_day)} zasiłek "
            "chorobowy już nie przysługuje.",
            facts=facts,
            legal_basis=BASIS_PERIOD + BASIS_REHABILITATION,
            alternatives=(REHABILITATION,),
            assumptions=ASSUMPTIONS,
        )
    last_day = on_day + timedelta(days=status.remaining)
    return Decision(
        verdict=Verdict.YES,
        summary=f"Tak – {format_date(on_day)} to {status.used_days}. dzień okresu "
        f"zasiłkowego ({status.limit} dni, {kind}). Zostało {status.remaining} dni – "
        f"przy nieprzerwanej niezdolności do {format_date(last_day)}.",
        facts=facts,
        legal_basis=BASIS_PERIOD,
        assumptions=ASSUMPTIONS,
        period=(status.start, last_day),
    )
