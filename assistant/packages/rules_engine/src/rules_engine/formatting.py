"""Formatowanie wartości do tekstów kart (polskie konwencje)."""

from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Final

CENT: Final = Decimal("0.01")


def money(value: Decimal) -> Decimal:
    """Zaokrąglenie do grosza (ROUND_HALF_UP)."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def format_pln(value: Decimal) -> str:
    """4890.5 → „4 890,50 zł” (twarda spacja jako separator tysięcy)."""
    whole, _, cents = f"{money(value):.2f}".partition(".")
    groups = f"{int(whole):,}".replace(",", " ")
    return f"{groups},{cents} zł"


def format_percent(rate: Decimal) -> str:
    """0.815 → „81,5%”."""
    return f"{(rate * 100).normalize():f}".replace(".", ",") + "%"


def format_date(day: date) -> str:
    """2026-11-12 → „12.11.2026”."""
    return day.strftime("%d.%m.%Y")
