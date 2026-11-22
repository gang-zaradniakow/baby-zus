"""Werdykty uprawnień (kategorie A i H): YES / NO / NEED_INFO (ZUS-13).

Zasada: brak danych daje NEED_INFO z listą brakujących pól – nigdy NO.
Ryzyka (kategoria H) trafiają do ``Decision.warnings`` i nie zmieniają werdyktu.
"""

from rules_engine.eligibility.decision import Decision
from rules_engine.eligibility.maternity import check_equivalent_maternity, check_maternity
from rules_engine.eligibility.sickness import check_sickness_in_pregnancy

__all__ = [
    "Decision",
    "check_equivalent_maternity",
    "check_maternity",
    "check_sickness_in_pregnancy",
]
