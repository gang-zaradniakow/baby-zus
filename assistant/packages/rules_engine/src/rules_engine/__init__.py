"""Deterministyczny silnik reguł: werdykty, okresy i kwoty zasiłków.

Zasada projektu: liczby daje silnik, słowa daje LLM. Pakiet nie wykonuje I/O
i nie zależy od żadnego frameworka – wszystkie dane (w tym datę „dziś”) dostaje
jako argumenty.
"""

from importlib.metadata import version

__version__ = version("zus-rules-engine")
