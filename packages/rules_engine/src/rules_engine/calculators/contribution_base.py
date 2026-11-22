"""Podstawa wymiaru zasiłku (ZUS-12).

Reguły (ustawa zasiłkowa):
- przeciętne miesięczne wynagrodzenie (przychód) z 12 pełnych miesięcy kalendarzowych
  poprzedzających miesiąc zdarzenia (np. porodu, początku niezdolności do pracy),
- przy krótszym ubezpieczeniu – z pełnych miesięcy kalendarzowych ubezpieczenia,
- po odliczeniu składek potrąconych z przychodu (stopa ze sprawy – ustalenie U7;
  gdy jej brak – wartość domyślna z parametrów, oznaczona jako założenie).

Obliczenie: dla każdego miesiąca ``potrącenie = round(przychód × stopa, 0.01)``,
``przychód − potrącenie``; podstawa = średnia tych kwot zaokrąglona do grosza (ROUND_HALF_UP).

Uproszczenia MVP (podawane w założeniach wyniku):
- miesiące traktujemy jako w pełni przepracowane – bez uzupełniania wynagrodzenia
  i bez wyłączania miesięcy przepracowanych w mniej niż połowie,
- bez składników rocznych/kwartalnych i bez gwarancji minimalnego wynagrodzenia,
- jedna stopa potrącenia (bez zaokrąglania każdej składki osobno – możliwa różnica 0,01 zł).
"""

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from typing import Final

from contracts import Fact, FactSource, InsuranceProfile, InsuranceTitle
from rules_engine.formatting import format_percent, format_pln, money
from rules_engine.insurance import Span, merged_sickness_spans, titles_on
from rules_engine.outcomes import NeedInfo, OutOfScope
from rules_engine.params import LegalBasis, ParamSet
from rules_engine.params.base import uz

WINDOW_MONTHS: Final = 12
SALARIES_FIELD: Final = "applicant.insurance.salaries"

BASIS_EMPLOYEE: Final = (uz("art. 36"), uz("art. 3"))
BASIS_NON_EMPLOYEE: Final = (uz("art. 48", to_verify=True), uz("art. 3"))
BASIS_NO_FULL_MONTH: Final = (uz("art. 37", to_verify=True),)

ASSUMPTION_FULL_MONTHS: Final = (
    "Przyjęto, że każdy miesiąc był w pełni przepracowany – bez uzupełniania wynagrodzenia "
    "za dni nieobecności i bez składników rocznych."
)


# --- miesiące ------------------------------------------------------------------------


def month_key(day: date) -> str:
    return f"{day.year:04d}-{day.month:02d}"


def month_start(key: str) -> date:
    year, month = key.split("-")
    return date(int(year), int(month), 1)


def month_end(key: str) -> date:
    start = month_start(key)
    next_month = (start.replace(day=28) + timedelta(days=4)).replace(day=1)
    return next_month - timedelta(days=1)


def _fully_insured(key: str, merged: list[Span]) -> bool:
    start, end = month_start(key), month_end(key)
    return any(a <= start and end <= b for a, b in merged)


def window_before(event_date: date, months: int = WINDOW_MONTHS) -> list[str]:
    """Miesiące kalendarzowe poprzedzające miesiąc zdarzenia, od najstarszego."""
    keys: list[str] = []
    cursor = event_date.replace(day=1)
    for _ in range(months):
        cursor = (cursor - timedelta(days=1)).replace(day=1)
        keys.append(month_key(cursor))
    return sorted(keys)


# --- wynik ------------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class ContributionBase:
    amount: Decimal
    months: tuple[str, ...]
    """Miesiące, z których policzono średnią."""
    excluded_months: tuple[str, ...]
    """Miesiące z przychodem, pominięte jako niepełne miesiące ubezpieczenia."""
    deduction_rate: Decimal
    deduction_rate_source: FactSource | None
    """Źródło stopy ze sprawy; ``None`` – użyto wartości domyślnej z parametrów."""
    salaries_source: FactSource
    assumptions: tuple[str, ...]
    legal_basis: tuple[LegalBasis, ...]

    def facts(self) -> list[Fact]:
        """Fakty do bloku „Dlaczego” karty odpowiedzi."""
        facts = [
            Fact(
                label="Podstawa wymiaru",
                value=f"{format_pln(self.amount)} (średnia z {len(self.months)} mies.: "
                f"{self.months[0]} – {self.months[-1]})",
                source=self.salaries_source,
            )
        ]
        if self.deduction_rate_source is not None:
            facts.append(
                Fact(
                    label="Potrącone składki",
                    value=format_percent(self.deduction_rate),
                    source=self.deduction_rate_source,
                )
            )
        return facts


type BaseOutcome = ContributionBase | NeedInfo | OutOfScope


def contribution_base(
    insurance: InsuranceProfile, event_date: date, params: ParamSet
) -> BaseOutcome:
    """Podstawa wymiaru dla zdarzenia z dnia ``event_date`` wg parametrów ``params``."""
    window = window_before(event_date)
    salaries = {s.month: s.gross for s in insurance.salaries if s.month in window}
    merged = merged_sickness_spans(insurance.periods)
    assumptions: list[str] = [ASSUMPTION_FULL_MONTHS]

    if merged:
        insured = [m for m in window if _fully_insured(m, merged)]
        if not insured:
            if any(a <= event_date <= b for a, b in merged):
                return OutOfScope(
                    "Brak pełnego miesiąca ubezpieczenia przed zdarzeniem – podstawą jest "
                    "wynagrodzenie z umowy za pełny miesiąc; ten przypadek wymaga ZUS.",
                    BASIS_NO_FULL_MONTH,
                )
            return NeedInfo((SALARIES_FIELD,), "Brak okresów ubezpieczenia przed zdarzeniem.")
        without_salary = [m for m in insured if m not in salaries]
        if without_salary:
            return NeedInfo(
                (SALARIES_FIELD,),
                f"Brak przychodu za miesiące ubezpieczenia: {', '.join(without_salary)}.",
            )
        excluded = tuple(sorted(m for m in salaries if m not in insured))
        if excluded:
            assumptions.append(f"Pominięto niepełne miesiące ubezpieczenia: {', '.join(excluded)}.")
        months = tuple(insured)
    else:
        if not salaries:
            return NeedInfo((SALARIES_FIELD,), "Brak przychodów z 12 miesięcy przed zdarzeniem.")
        excluded = ()
        months = tuple(sorted(salaries))
        assumptions.append(
            "Okresów ubezpieczenia nie podano – przyjęto, że podane miesiące są pełne."
        )

    if insurance.deduction_rate is not None:
        rate, rate_source = insurance.deduction_rate, insurance.source
    else:
        rate, rate_source = params.default_deduction_rate.value, None
        assumptions.append(
            f"Przyjęto domyślną stopę potrąconych składek {format_percent(rate)} "
            "(brak stopy w danych sprawy)."
        )

    net = [salaries[m] - money(salaries[m] * rate) for m in months]
    amount = money(sum(net, Decimal(0)) / len(net))

    titles = titles_on(event_date, insurance.periods)
    employee = not titles or InsuranceTitle.EMPLOYMENT in titles
    return ContributionBase(
        amount=amount,
        months=months,
        excluded_months=excluded,
        deduction_rate=rate,
        deduction_rate_source=rate_source,
        salaries_source=insurance.source,
        assumptions=tuple(assumptions),
        legal_basis=BASIS_EMPLOYEE if employee else BASIS_NON_EMPLOYEE,
    )
