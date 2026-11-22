"""Wspólne elementy reguł: fakty o ubezpieczeniu, zadłużenie (JDG), ryzyka (kategoria H)."""

from datetime import date, timedelta
from decimal import Decimal
from statistics import median
from typing import Final

from contracts import Fact, InsurancePeriod, InsuranceProfile, InsuranceTitle, Profile
from contracts.enums import SicknessInsurance
from rules_engine.formatting import format_date, format_pln
from rules_engine.insurance import periods_on

PERIODS_FIELD: Final = "applicant.insurance.periods"
EXPECTED_FIELD: Final = "child.expectedBirthDate"
DEBT_FIELD: Final = "applicant.insurance.contributionDebt"

#: Przybliżony czas trwania ciąży do oceny „czy zdarzenie było w ciąży”.
PREGNANCY_DAYS: Final = 280
#: Wzrost przychodu traktowany jako „skok podstawy” (ryzyko weryfikacji przez ZUS).
SALARY_JUMP_FACTOR: Final = Decimal("1.5")

TITLE_NAMES: Final = {
    InsuranceTitle.EMPLOYMENT: "umowa o pracę",
    InsuranceTitle.MANDATE_CONTRACT: "umowa zlecenia",
    InsuranceTitle.BUSINESS: "działalność gospodarcza",
}
SICKNESS_NAMES: Final = {
    SicknessInsurance.MANDATORY: "obowiązkowe",
    SicknessInsurance.VOLUNTARY: "dobrowolne",
    SicknessInsurance.NONE: "brak",
}


def describe_period(period: InsurancePeriod) -> str:
    end = f" do {format_date(period.date_to)}" if period.date_to else ""
    return (
        f"{TITLE_NAMES[period.title]}, ubezpieczenie chorobowe "
        f"{SICKNESS_NAMES[period.sickness]}, od {format_date(period.date_from)}{end}"
    )


def insurance_facts(insurance: InsuranceProfile, day: date) -> list[Fact]:
    active = periods_on(day, insurance.periods)
    if not active:
        return [
            Fact(
                label=f"Ubezpieczenie w dniu {format_date(day)}",
                value="brak",
                source=insurance.source,
            )
        ]
    return [
        Fact(label="Tytuł ubezpieczenia", value=describe_period(p), source=insurance.source)
        for p in active
    ]


def is_business(insurance: InsuranceProfile, day: date) -> bool:
    return any(p.title is InsuranceTitle.BUSINESS for p in periods_on(day, insurance.periods))


def debt_warning(insurance: InsuranceProfile) -> str | None:
    debt = insurance.contribution_debt
    if debt is None or debt == 0:
        return None
    return (
        f"Zadłużenie w ZUS: {format_pln(debt)}. Przy działalności gospodarczej zasiłek "
        "przysługuje dopiero po spłacie całego zadłużenia – sprawdź warunki w ZUS."
    )


def estimated_pregnancy_start(profile: Profile) -> date | None:
    reference = profile.child.birth_date or profile.child.expected_birth_date
    return reference - timedelta(days=PREGNANCY_DAYS) if reference else None


def contract_risk_warnings(profile: Profile) -> tuple[str, ...]:
    """Ryzyko zakwestionowania umowy lub podstawy (H.06) – nie zmienia werdyktu."""
    warnings: list[str] = []
    insurance = profile.applicant.insurance
    pregnancy_start = estimated_pregnancy_start(profile)
    starts = [p.date_from for p in insurance.periods]
    if pregnancy_start and starts and max(starts) >= pregnancy_start:
        warnings.append(
            f"Umowa lub ubezpieczenie od {format_date(max(starts))} zaczęło się w czasie ciąży. "
            "ZUS może sprawdzić, czy umowa jest rzeczywista – zachowaj dokumenty "
            "potwierdzające pracę."
        )
    amounts = [s.gross for s in sorted(insurance.salaries, key=lambda s: s.month)]
    if len(amounts) >= 3 and amounts[-1] > SALARY_JUMP_FACTOR * median(amounts[:-1]):
        warnings.append(
            "Ostatni przychód jest wyraźnie wyższy niż wcześniejsze. ZUS może zweryfikować, "
            "czy wynagrodzenie odpowiada wykonywanej pracy."
        )
    return tuple(warnings)
