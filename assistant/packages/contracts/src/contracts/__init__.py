"""Wspólne modele danych: AnswerCard (§5.1), Profile (§3.3), Intent (§4) i słowniki.

Jedyny pakiet, od którego zależą wszystkie aplikacje. JSON Schema: ``docs/contracts``.
"""

from importlib.metadata import version

from contracts.answer import (
    Action,
    AnswerCard,
    Calculation,
    Fact,
    LegalRef,
    MissingField,
    Period,
)
from contracts.enums import (
    ActionType,
    AnswerType,
    Category,
    EmploymentEndReason,
    FactSource,
    Flag,
    GeneratedBy,
    InsuranceTitle,
    ParentRole,
    PeriodType,
    PlacementKind,
    SicknessInsurance,
    SpecialEventKind,
    Stage,
    Verdict,
)
from contracts.intent import Intent
from contracts.profile import (
    ChildInfo,
    InsurancePeriod,
    InsuranceProfile,
    LeavePart,
    MonthlySalary,
    ParentProfile,
    PayerInfo,
    Placement,
    Profile,
    SickLeave,
    SpecialEvent,
    StageInfo,
)
from contracts.types import OUT_OF_CATALOG

__version__ = version("zus-contracts")

__all__ = [
    "OUT_OF_CATALOG",
    "Action",
    "ActionType",
    "AnswerCard",
    "AnswerType",
    "Calculation",
    "Category",
    "ChildInfo",
    "EmploymentEndReason",
    "Fact",
    "FactSource",
    "Flag",
    "GeneratedBy",
    "InsurancePeriod",
    "InsuranceProfile",
    "InsuranceTitle",
    "Intent",
    "LeavePart",
    "LegalRef",
    "MissingField",
    "MonthlySalary",
    "ParentProfile",
    "ParentRole",
    "PayerInfo",
    "Period",
    "PeriodType",
    "Placement",
    "PlacementKind",
    "Profile",
    "SickLeave",
    "SicknessInsurance",
    "SpecialEvent",
    "SpecialEventKind",
    "Stage",
    "StageInfo",
    "Verdict",
]
