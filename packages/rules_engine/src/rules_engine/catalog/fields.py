"""Pola profilu, o które asystent może dopytać (werdykt NEED_INFO → ``MissingField``).

Klucze to ścieżki w JSON profilu (camelCase, jak w ``docs/contracts/profile.schema.json``).
"""

from typing import Final

FIELD_QUESTIONS: Final[dict[str, str]] = {
    "applicant.birthDate": "Jaka jest Twoja data urodzenia?",
    "applicant.insurance.periods": (
        "Na jakiej podstawie podlegasz ubezpieczeniu (umowa o pracę, zlecenie, działalność) "
        "i od kiedy?"
    ),
    "applicant.insurance.payer": "Ilu ubezpieczonych zgłaszał Twój pracodawca lub zleceniodawca?",
    "applicant.insurance.salaries": (
        "Jakie były Twoje miesięczne przychody brutto z ostatnich 12 miesięcy?"
    ),
    "applicant.insurance.sickLeaves": "Czy masz zwolnienie lekarskie (e-ZLA)? Od kiedy do kiedy?",
    "applicant.insurance.contributionDebt": "Czy masz zaległości w składkach ZUS?",
    "partner": "Na jakiej podstawie podlega ubezpieczeniu drugi rodzic?",
    "child.expectedBirthDate": "Jaka jest przewidywana data porodu?",
    "child.birthDate": "Kiedy urodziło się dziecko?",
    "child.childrenCount": "Ile dzieci urodziło się przy jednym porodzie?",
    "child.zaZyciem": "Czy masz zaświadczenie lekarskie „Za życiem” dotyczące dziecka?",
    "child.placement": (
        "Kiedy dziecko zostało przyjęte na wychowanie i jaka jest jego data urodzenia?"
    ),
    "specialEvents": "Czy wydarzyło się coś, co może zmienić uprawnienia (np. pobyt w szpitalu)?",
    "leavePlan": "Jak planujecie podzielić urlop i czy ktoś z Was będzie w tym czasie pracować?",
}
