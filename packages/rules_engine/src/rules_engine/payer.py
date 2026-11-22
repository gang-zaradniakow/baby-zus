"""Kto wypłaca zasiłek (G.05) – art. 61 ustawy zasiłkowej.

- płatnik składek (pracodawca, zleceniodawca), który według stanu na 30 listopada roku
  poprzedzającego zgłaszał do ubezpieczenia chorobowego WIĘCEJ niż 20 osób, wypłaca zasiłki
  sam; pozostałym ubezpieczonym wypłaca ZUS,
- osobom prowadzącym działalność i osobom po ustaniu ubezpieczenia zawsze wypłaca ZUS.
"""

from dataclasses import dataclass
from datetime import date
from enum import StrEnum
from typing import Final

from contracts import Fact, InsuranceProfile, InsuranceTitle
from rules_engine.formatting import format_date
from rules_engine.insurance import titles_on
from rules_engine.outcomes import NeedInfo
from rules_engine.params import LegalBasis, ParamSet
from rules_engine.params.base import uz

PAYER_FIELD: Final = "applicant.insurance.payer"
BASIS_PAYER: Final = (uz("art. 61"),)


class Payer(StrEnum):
    CONTRIBUTION_PAYER = "CONTRIBUTION_PAYER"  # pracodawca albo zleceniodawca
    ZUS = "ZUS"


PAYER_NAMES: Final = {
    (Payer.CONTRIBUTION_PAYER, InsuranceTitle.EMPLOYMENT): "pracodawca",
    (Payer.CONTRIBUTION_PAYER, InsuranceTitle.MANDATE_CONTRACT): "zleceniodawca",
}


@dataclass(frozen=True, slots=True)
class PayerDecision:
    payer: Payer
    title: InsuranceTitle | None
    """Tytuł, którego dotyczy wypłata; ``None`` – po ustaniu ubezpieczenia."""
    summary: str
    facts: tuple[Fact, ...]
    legal_basis: tuple[LegalBasis, ...] = BASIS_PAYER

    @property
    def payer_name(self) -> str:
        if self.title is None:
            return "ZUS"
        return PAYER_NAMES.get((self.payer, self.title), "ZUS")


def _main_title(titles: set[InsuranceTitle]) -> InsuranceTitle | None:
    for title in (
        InsuranceTitle.EMPLOYMENT,
        InsuranceTitle.MANDATE_CONTRACT,
        InsuranceTitle.BUSINESS,
    ):
        if title in titles:
            return title
    return None


def determine_payer(
    insurance: InsuranceProfile, event_date: date, params: ParamSet
) -> PayerDecision | NeedInfo:
    """Płatnik zasiłku dla zdarzenia z dnia ``event_date`` (poród, początek niezdolności)."""
    title = _main_title(titles_on(event_date, insurance.periods))
    if title is None:
        return PayerDecision(
            Payer.ZUS,
            None,
            "Zasiłek wypłaci ZUS – w dniu zdarzenia nie masz już tytułu ubezpieczenia.",
            (),
        )
    if title is InsuranceTitle.BUSINESS:
        return PayerDecision(
            Payer.ZUS,
            title,
            "Zasiłek wypłaci ZUS – przy działalności gospodarczej zawsze wypłaca ZUS.",
            (),
        )

    payer_info = insurance.payer
    expected_year = event_date.year - 1
    if payer_info is None:
        return NeedInfo(
            (PAYER_FIELD,),
            "Potrzebna liczba osób zgłoszonych przez płatnika do ubezpieczenia chorobowego "
            f"na 30.11.{expected_year}.",
        )
    if payer_info.count_date.year != expected_year:
        return NeedInfo(
            (PAYER_FIELD,),
            f"Liczba ubezpieczonych jest podana na {format_date(payer_info.count_date)}, "
            f"a decyduje stan na 30.11.{expected_year}.",
        )

    threshold = params.payer_threshold_insured.value
    count = payer_info.insured_count_nov30
    fact = Fact(
        label=f"Liczba ubezpieczonych u płatnika na {format_date(payer_info.count_date)}",
        value=f"{count} (próg: więcej niż {threshold})",
        source=insurance.source,
    )
    if count > threshold:
        name = PAYER_NAMES[(Payer.CONTRIBUTION_PAYER, title)]
        return PayerDecision(
            Payer.CONTRIBUTION_PAYER,
            title,
            f"Zasiłek wypłaci {name} – zgłaszał do ubezpieczenia więcej niż {threshold} osób.",
            (fact,),
        )
    return PayerDecision(
        Payer.ZUS,
        title,
        f"Zasiłek wypłaci ZUS – płatnik zgłaszał do ubezpieczenia nie więcej niż {threshold} osób.",
        (fact,),
    )
