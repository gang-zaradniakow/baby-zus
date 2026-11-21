"""Słowniki wartości używane w kontrakcie."""

from enum import StrEnum


class Verdict(StrEnum):
    YES = "YES"
    NO = "NO"
    NEED_INFO = "NEED_INFO"


class FactSource(StrEnum):
    """Skąd pochodzi fakt: pobrany z ZUS, wpisany przez użytkownika, odczytany z dokumentu."""

    ZUS = "ZUS"
    USER = "USER"
    DOCUMENT = "DOCUMENT"


class ActionType(StrEnum):
    """Przyciski „Co dalej”. ``REMINDER`` usunięty razem z powiadomieniami (ustalenie U9)."""

    FORM = "FORM"
    SIMULATE = "SIMULATE"
    ESCALATE = "ESCALATE"


class GeneratedBy(StrEnum):
    """Autor tekstu karty.

    ``RULES`` – szablon silnika; ``LLM_EXPLAINED`` – tekst napisał LLM (oznaczenie AI wg AI Act).
    """

    RULES = "RULES"
    LLM_EXPLAINED = "LLM_EXPLAINED"


class PeriodType(StrEnum):
    """Rodzaj świadczenia w okresie wyliczenia albo w planie urlopu."""

    MACIERZYNSKI = "MACIERZYNSKI"
    NA_WARUNKACH_MACIERZYNSKIEGO = "NA_WARUNKACH_MACIERZYNSKIEGO"
    UZUPELNIAJACY_MACIERZYNSKI = "UZUPELNIAJACY_MACIERZYNSKI"
    RODZICIELSKI = "RODZICIELSKI"
    OJCOWSKI = "OJCOWSKI"
    CHOROBOWY = "CHOROBOWY"
    W_WYSOKOSCI_MACIERZYNSKIEGO = "W_WYSOKOSCI_MACIERZYNSKIEGO"
    OPIEKUNCZY = "OPIEKUNCZY"
    SWIADCZENIE_REHABILITACYJNE = "SWIADCZENIE_REHABILITACYJNE"


class Stage(StrEnum):
    """Etap ścieżki rodzica (ustalenie U3)."""

    E0 = "E0"  # ciąża
    E1 = "E1"  # ≤ 6 tygodni do przewidywanej daty porodu
    E2 = "E2"  # po porodzie (urlop macierzyński)
    E3 = "E3"  # urlop rodzicielski i powrót do pracy


class Flag(StrEnum):
    """Flagi nakładane na etap (ustalenie U3)."""

    ADOPTION = "ADOPTION"  # przysposobienie albo rodzina zastępcza
    DIFFICULT = "DIFFICULT"  # sytuacja trudna: poronienie, martwe urodzenie, zgon, ciężka choroba


class AnswerType(StrEnum):
    """Typ odpowiedzi intencji (§4)."""

    VERDICT = "W"
    CALCULATION = "K"
    PROCEDURE = "P"
    INFORMATION = "I"
    SIMULATION = "S"


class Category(StrEnum):
    """Kategoria katalogu pytań (§4)."""

    ELIGIBILITY = "A"
    AMOUNTS = "B"
    LEAVE = "C"
    OTHER_PARENT = "D"
    WORK = "E"
    SPECIAL = "F"
    DOCUMENTS = "G"
    RISKS = "H"


class InsuranceTitle(StrEnum):
    EMPLOYMENT = "EMPLOYMENT"  # umowa o pracę
    MANDATE_CONTRACT = "MANDATE_CONTRACT"  # umowa zlecenia
    BUSINESS = "BUSINESS"  # działalność gospodarcza


class SicknessInsurance(StrEnum):
    MANDATORY = "MANDATORY"
    VOLUNTARY = "VOLUNTARY"
    NONE = "NONE"


class EmploymentEndReason(StrEnum):
    BANKRUPTCY = "BANKRUPTCY"
    LIQUIDATION = "LIQUIDATION"
    EMPLOYER_DEATH = "EMPLOYER_DEATH"
    COURT_RULING = "COURT_RULING"
    CONTRACT_EXPIRY = "CONTRACT_EXPIRY"
    OTHER = "OTHER"


class ParentRole(StrEnum):
    MOTHER = "MOTHER"
    FATHER = "FATHER"


class PlacementKind(StrEnum):
    ADOPTION = "ADOPTION"  # przysposobienie
    FOSTER_FAMILY = "FOSTER_FAMILY"  # rodzina zastępcza niezawodowa


class SpecialEventKind(StrEnum):
    MISCARRIAGE = "MISCARRIAGE"
    STILLBIRTH = "STILLBIRTH"
    CHILD_DEATH = "CHILD_DEATH"
    PREMATURE_BIRTH = "PREMATURE_BIRTH"
    CHILD_HOSPITALIZATION = "CHILD_HOSPITALIZATION"
    MOTHER_HOSPITALIZATION = "MOTHER_HOSPITALIZATION"
    MOTHER_UNABLE_TO_CARE = "MOTHER_UNABLE_TO_CARE"  # niezdolność do samodzielnej egzystencji
    MOTHER_DEATH = "MOTHER_DEATH"
    CHILD_ABANDONMENT = "CHILD_ABANDONMENT"
