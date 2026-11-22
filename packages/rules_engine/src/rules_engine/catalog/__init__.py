"""Katalog intencji A–H, lista pytań dla etapu i wykrywanie etapu E0–E3 z flagami (ZUS-11)."""

from rules_engine.catalog.featured import FEATURED, featured_intents
from rules_engine.catalog.fields import FIELD_QUESTIONS
from rules_engine.catalog.intents import INTENTS, INTENTS_BY_ID, get_intent, search_intents
from rules_engine.catalog.stages import StageResult, detect_flags, detect_stage

__all__ = [
    "FEATURED",
    "FIELD_QUESTIONS",
    "INTENTS",
    "INTENTS_BY_ID",
    "StageResult",
    "detect_flags",
    "detect_stage",
    "featured_intents",
    "get_intent",
    "search_intents",
]
