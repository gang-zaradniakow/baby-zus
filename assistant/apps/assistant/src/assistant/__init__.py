"""Poziom 2: orkiestrator LLM, walidator liczb, guardrails i RAG.

LLM jest wymienny przez interfejs ``LLMClient``; model wybiera konfiguracja (ZUS-50).
"""

from importlib.metadata import version

__version__ = version("zus-assistant")
