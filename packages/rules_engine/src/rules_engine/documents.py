"""Jakie dokumenty i gdzie złożyć (G.01–G.04) – §3.2 i rozporządzenie od 24.10.2026.

Zmiany od 24.10.2026: jeden wniosek ZAM (zamiast ZAM, ZUR, ZAO), przedsiębiorcy nie
dostarczają już Z-3b. Gdy zasiłek wypłaca ZUS, odpis aktu urodzenia ZUS pobiera sam;
gdy wypłaca płatnik – trzeba go dołączyć.

Lista zależy od dnia złożenia (dziś), nie od dnia zdarzenia – formularze to procedura,
nie parametr kalkulacji (ADR 0001).
"""

from dataclasses import dataclass
from datetime import date
from enum import StrEnum
from typing import Final

from contracts import InsuranceTitle, Profile
from rules_engine.formatting import format_date
from rules_engine.outcomes import NeedInfo
from rules_engine.params import LegalBasis, ParamSet
from rules_engine.params.base import Act
from rules_engine.payer import Payer, PayerDecision, determine_payer

RULES_VALID_FROM: Final = date(2026, 10, 24)
BASIS_DOCUMENTS: Final = (
    LegalBasis(Act.ROZPORZADZENIE_ZASILKOWE, "przepisy rozporządzenia", to_verify=True),
)


class BenefitKind(StrEnum):
    MATERNITY = "MATERNITY"  # zasiłek macierzyński (macierzyński, rodzicielski, ojcowski)
    SICKNESS = "SICKNESS"  # zasiłek chorobowy


@dataclass(frozen=True, slots=True)
class Document:
    name: str
    symbol: str | None
    who: str
    """Kto przygotowuje i komu przekazuje."""
    note: str | None = None


LEAVE_REQUEST = Document(
    "Wniosek o urlop macierzyński / rodzicielski / ojcowski", None, "Ty → pracodawca"
)
ZAM = Document("Wniosek o zasiłek macierzyński", "ZAM", "Ty → płatnik zasiłku")
Z3 = Document("Zaświadczenie płatnika składek", "Z-3", "pracodawca → ZUS")
Z3A = Document(
    "Zaświadczenie płatnika składek dla osób niebędących pracownikami",
    "Z-3a",
    "zleceniodawca → ZUS",
)
BIRTH_CERTIFICATE = Document(
    "Skrócony odpis aktu urodzenia dziecka",
    None,
    "Ty → płatnik",
    "Potrzebny, gdy zasiłek wypłaca płatnik. Gdy wypłaca ZUS – pobiera akt sam.",
)
COURT_ORDER = Document(
    "Orzeczenie sądu o przysposobieniu albo o umieszczeniu w rodzinie zastępczej",
    None,
    "Ty → płatnik zasiłku",
    "Wystarczy też orzeczenie wydane w trybie zabezpieczenia.",
)
EZLA = Document(
    "Zwolnienie lekarskie",
    "e-ZLA",
    "lekarz → ZUS i płatnik (automatycznie)",
    "W ciąży lekarz wpisuje kod „B” – wtedy zasiłek wynosi 100%.",
)


@dataclass(frozen=True, slots=True)
class DocumentList:
    documents: tuple[Document, ...]
    where: str
    payer: PayerDecision
    notes: tuple[str, ...]
    legal_basis: tuple[LegalBasis, ...]


def _where(payer: PayerDecision) -> str:
    if payer.payer is Payer.CONTRIBUTION_PAYER:
        return f"Dokumenty składasz u płatnika ({payer.payer_name}) – on wypłaca zasiłek."
    if payer.title is InsuranceTitle.EMPLOYMENT:
        return "Wniosek składasz u pracodawcy – przekaże go do ZUS razem z zaświadczeniem Z-3."
    return "Dokumenty składasz w ZUS: przez PUE/eZUS albo w placówce."


def required_documents(
    profile: Profile, kind: BenefitKind, event_date: date, params: ParamSet, today: date
) -> DocumentList | NeedInfo:
    """Lista dokumentów dla świadczenia ``kind`` i zdarzenia z dnia ``event_date``."""
    payer = determine_payer(profile.applicant.insurance, event_date, params)
    if isinstance(payer, NeedInfo):
        return payer

    by_zus = payer.payer is Payer.ZUS
    title = payer.title
    documents: list[Document] = []
    notes: list[str] = []

    if kind is BenefitKind.SICKNESS:
        documents.append(EZLA)
        if by_zus and title is InsuranceTitle.EMPLOYMENT:
            documents.append(Z3)
        elif by_zus and title is InsuranceTitle.MANDATE_CONTRACT:
            documents.append(Z3A)
    else:
        if title is InsuranceTitle.EMPLOYMENT:
            documents.append(LEAVE_REQUEST)
            documents.append(Z3 if by_zus else BIRTH_CERTIFICATE)
        elif title is InsuranceTitle.MANDATE_CONTRACT:
            documents.append(ZAM)
            documents.append(Z3A if by_zus else BIRTH_CERTIFICATE)
        else:  # działalność albo po ustaniu ubezpieczenia – wypłaca ZUS
            documents.append(ZAM)
            if title is None:
                documents.append(Z3)
                notes.append("Zaświadczenie Z-3 wystawia były pracodawca.")
        if profile.child.placement is not None:
            documents.append(COURT_ORDER)

    if title is InsuranceTitle.BUSINESS:
        notes.append(
            "Od 24.10.2026 przedsiębiorcy nie dostarczają zaświadczenia Z-3b. ZUS sprawdzi "
            "sam, czy nie masz zadłużenia w składkach."
        )
    if today < RULES_VALID_FROM:
        notes.append(
            f"Lista według przepisów od {format_date(RULES_VALID_FROM)} – wcześniej "
            "obowiązywały osobne wnioski ZAM, ZUR i ZAO."
        )
    return DocumentList(
        documents=tuple(documents),
        where=_where(payer),
        payer=payer,
        notes=tuple(notes),
        legal_basis=BASIS_DOCUMENTS + payer.legal_basis,
    )
