"""Model parametrów prawnych: wartość + podstawa prawna, zestawy z datami obowiązywania.

Zasady (ustalenie U1):
- parametry są w kodzie, nie w panelu ani w bazie,
- zmiana przepisów = NOWY moduł zestawu (``vRRRR_MM_DD.py``) z datą wejścia w życie;
  starych zestawów nie zmieniamy ani nie usuwamy – potrzebne są do spraw sprzed zmiany,
- silnik wybiera zestaw obowiązujący w dniu zdarzenia (``registry.get_params``).

Podstawy prawne są podane na poziomie artykułu. Pozycje oznaczone ``to_verify=True``
wskazują przepis ogólnie i wymagają przeglądu przez osobę znającą przepisy.
"""

from collections.abc import Iterator
from dataclasses import dataclass, fields
from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Any, Final

VERSION_PREFIX: Final = "params-"


class Act(StrEnum):
    KODEKS_PRACY = "Kodeks pracy"
    USTAWA_ZASILKOWA = "ustawa zasiłkowa"
    USTAWA_O_SYSTEMIE = "ustawa o systemie ubezpieczeń społecznych"
    ROZPORZADZENIE_ZASILKOWE = "rozporządzenie w sprawie dokumentów zasiłkowych"


#: Strony aktów w ISAP (Internetowy System Aktów Prawnych, isap.sejm.gov.pl).
ACT_URLS: Final[dict[Act, str]] = {
    # ustawa z 26 czerwca 1974 r. – Kodeks pracy
    Act.KODEKS_PRACY: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19740240141",
    # ustawa z 25 czerwca 1999 r. o świadczeniach pieniężnych z ubezpieczenia społecznego
    # w razie choroby i macierzyństwa
    Act.USTAWA_ZASILKOWA: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19990600636",
    # ustawa z 13 października 1998 r. o systemie ubezpieczeń społecznych
    Act.USTAWA_O_SYSTEMIE: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19981370887",
    # rozporządzenie o dokumentach zasiłkowych obowiązujące od 24.10.2026 (Dz. U. poz. 1316)
    # – identyfikator ISAP do potwierdzenia
    Act.ROZPORZADZENIE_ZASILKOWE: "https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20260001316",
}


@dataclass(frozen=True, slots=True)
class LegalBasis:
    act: Act
    article: str
    to_verify: bool = False

    @property
    def url(self) -> str:
        return ACT_URLS[self.act]

    def __str__(self) -> str:
        return f"{self.act}, {self.article}"


@dataclass(frozen=True, slots=True)
class Param[T]:
    """Wartość parametru z opisem i co najmniej jedną podstawą prawną."""

    value: T
    description: str
    basis: tuple[LegalBasis, ...]

    def __post_init__(self) -> None:
        if not self.basis:
            raise ValueError(f"parametr '{self.description}' nie ma podstawy prawnej")
        if isinstance(self.value, float):
            raise TypeError(f"parametr '{self.description}': użyj Decimal zamiast float")


def param[T](value: T, description: str, *basis: LegalBasis) -> Param[T]:
    return Param(value=value, description=description, basis=basis)


def kp(article: str, *, to_verify: bool = False) -> LegalBasis:
    return LegalBasis(Act.KODEKS_PRACY, article, to_verify)


def uz(article: str, *, to_verify: bool = False) -> LegalBasis:
    return LegalBasis(Act.USTAWA_ZASILKOWA, article, to_verify)


def usus(article: str, *, to_verify: bool = False) -> LegalBasis:
    return LegalBasis(Act.USTAWA_O_SYSTEMIE, article, to_verify)


#: Tabela „liczba dzieci → tygodnie”; ostatni wiersz obowiązuje także dla większej liczby.
type WeeksByChildren = tuple[tuple[int, int], ...]


@dataclass(frozen=True, slots=True, kw_only=True)
class ParamSet:
    """Komplet parametrów obowiązujących w przedziale dat ``[valid_from, valid_to]``."""

    valid_from: date
    valid_to: date | None
    """Ostatni dzień obowiązywania; ``None`` – zestaw aktualny."""

    # --- stawki zasiłku (ułamek podstawy wymiaru) ---------------------------------
    rate_maternity: Param[Decimal]
    rate_parental: Param[Decimal]
    rate_uniform: Param[Decimal]
    rate_paternity: Param[Decimal]
    rate_equivalent_maternity: Param[Decimal]
    rate_sickness_pregnancy: Param[Decimal]
    rate_supplementary_maternity: Param[Decimal] | None
    uniform_rate_application_days: Param[int]

    # --- zasiłek chorobowy ---------------------------------------------------------
    waiting_period_mandatory_days: Param[int]
    waiting_period_voluntary_days: Param[int]
    sickness_period_pregnancy_days: Param[int]
    employer_sick_pay_days: Param[int]
    employer_sick_pay_days_age_threshold: Param[int]
    employer_sick_pay_days_after_threshold: Param[int]

    # --- urlop macierzyński ---------------------------------------------------------
    maternity_leave_weeks: Param[WeeksByChildren]
    maternity_mandatory_weeks: Param[int]
    maternity_prenatal_max_weeks: Param[int]
    stillbirth_leave_weeks: Param[int]
    child_death_age_limit_weeks: Param[int]
    child_death_min_leave_days: Param[int]
    supplementary_maternity_max_weeks: Param[tuple[int, int]] | None
    """(krótszy, dłuższy) maksymalny wymiar uzupełniającego urlopu macierzyńskiego."""

    # --- urlop rodzicielski ---------------------------------------------------------
    parental_leave_weeks_single: Param[int]
    parental_leave_weeks_multiple: Param[int]
    parental_leave_weeks_za_zyciem_single: Param[int]
    parental_leave_weeks_za_zyciem_multiple: Param[int]
    parental_nontransferable_weeks: Param[int]
    parental_max_parts: Param[int]
    parental_deadline_child_age_years: Param[int]
    part_time_max_fraction: Param[Decimal]

    # --- urlop ojcowski -------------------------------------------------------------
    paternity_leave_days: Param[int]
    paternity_max_parts: Param[int]
    paternity_min_part_days: Param[int]
    paternity_deadline_months: Param[int]

    # --- adopcja i rodzina zastępcza -----------------------------------------------
    adoption_child_max_age: Param[int]
    foster_child_max_age: Param[int]
    foster_child_max_age_school_deferral: Param[int]

    # --- płatnik i podstawa wymiaru ------------------------------------------------
    payer_threshold_insured: Param[int]
    """Pracodawca wypłaca zasiłki, gdy ubezpieczonych na 30.11 jest WIĘCEJ niż ta wartość."""
    default_deduction_rate: Param[Decimal]

    def __post_init__(self) -> None:
        if self.valid_to is not None and self.valid_to < self.valid_from:
            raise ValueError(f"{self.version_id}: valid_to przed valid_from")
        table = self.maternity_leave_weeks.value
        if not table or table[0][0] != 1 or [c for c, _ in table] != list(range(1, len(table) + 1)):
            raise ValueError(f"{self.version_id}: tabela tygodni musi zaczynać się od 1 dziecka")

    @property
    def version_id(self) -> str:
        """Identyfikator zestawu, trafia do ``AnswerCard.engine_version``."""
        return f"{VERSION_PREFIX}{self.valid_from.isoformat()}"

    def covers(self, day: date) -> bool:
        return self.valid_from <= day and (self.valid_to is None or day <= self.valid_to)

    def iter_params(self) -> Iterator[tuple[str, Param[Any]]]:
        """Wszystkie ustawione parametry (nazwa pola, parametr) – np. dla panelu admina."""
        for f in fields(self):
            value = getattr(self, f.name)
            if isinstance(value, Param):
                yield f.name, value

    # --- odczyty pochodne -----------------------------------------------------------

    def maternity_weeks_for(self, children: int) -> int:
        """Wymiar urlopu macierzyńskiego dla liczby dzieci urodzonych przy jednym porodzie."""
        if children < 1:
            raise ValueError("liczba dzieci musi być ≥ 1")
        table = self.maternity_leave_weeks.value
        return dict(table).get(children, table[-1][1])

    def parental_weeks_for(self, children: int, *, za_zyciem: bool = False) -> int:
        """Wymiar urlopu rodzicielskiego (łącznie dla obojga rodziców)."""
        if children < 1:
            raise ValueError("liczba dzieci musi być ≥ 1")
        multiple = children > 1
        if za_zyciem:
            chosen = (
                self.parental_leave_weeks_za_zyciem_multiple
                if multiple
                else self.parental_leave_weeks_za_zyciem_single
            )
        else:
            chosen = (
                self.parental_leave_weeks_multiple if multiple else self.parental_leave_weeks_single
            )
        return chosen.value
