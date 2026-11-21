"""Typy pól wielokrotnego użytku: kwoty, stawki, identyfikatory, URL-e podstaw prawnych.

Kwoty i stawki to ``Decimal`` – nigdy ``float``. W JSON są serializowane jako string
(np. ``"4890.00"``), żeby żaden klient nie zgubił groszy na konwersji do liczby
zmiennoprzecinkowej. Na wejściu przyjmujemy też liczby JSON.
"""

from decimal import ROUND_HALF_UP, Decimal
from typing import Annotated, Final
from urllib.parse import urlsplit

from pydantic import AfterValidator, Field, WithJsonSchema

CENT: Final = Decimal("0.01")

#: Domeny dozwolone w linkach do podstaw prawnych (§1 pkt 2). ``gov.pl`` obejmuje
#: także ``pip.gov.pl`` i ``isap.sejm.gov.pl``.
ALLOWED_LEGAL_DOMAINS: Final = ("zus.pl", "gov.pl")


def _to_cents(value: Decimal) -> Decimal:
    # Precyzję (maks. 2 miejsca) sprawdza już Field; tu tylko ujednolicamy zapis: 4890 → 4890.00
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def _check_legal_url(value: str) -> str:
    parts = urlsplit(value)
    host = (parts.hostname or "").lower()
    allowed = any(host == d or host.endswith(f".{d}") for d in ALLOWED_LEGAL_DOMAINS)
    if parts.scheme != "https" or not allowed:
        domains = ", ".join(ALLOWED_LEGAL_DOMAINS)
        raise ValueError(f"link do podstawy prawnej musi być https w domenie: {domains}")
    return value


Money = Annotated[
    Decimal,
    Field(ge=0, max_digits=14, decimal_places=2, allow_inf_nan=False),
    AfterValidator(_to_cents),
    WithJsonSchema(
        {"type": "string", "pattern": r"^\d+\.\d{2}$", "examples": ["4890.00"]},
        mode="serialization",
    ),
]
"""Kwota w złotych, nieujemna, z dokładnością do grosza (silnik sam zaokrągla)."""

Fraction = Annotated[
    Decimal,
    Field(ge=0, le=1, max_digits=5, decimal_places=4),
    WithJsonSchema(
        {"type": "string", "pattern": r"^(0(\.\d{1,4})?|1(\.0{1,4})?)$", "examples": ["0.815"]},
        mode="serialization",
    ),
]
"""Ułamek z przedziału 0–1, np. stawka 0.815 albo wymiar pracy 0.5."""

Rate = Fraction
"""Stawka zasiłku jako ułamek podstawy (0.815 = 81,5%)."""

NonEmptyStr = Annotated[str, Field(min_length=1)]

YearMonth = Annotated[str, Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$", examples=["2026-03"])]

OUT_OF_CATALOG: Final = "OUT_OF_CATALOG"

IntentId = Annotated[
    str,
    Field(
        pattern=r"^(?:[A-H]\.\d{2}(?:_[a-z0-9_]+)?|OUT_OF_CATALOG)$",
        examples=["B.01_wysokosc_macierzynskiego", OUT_OF_CATALOG],
    ),
]
"""Identyfikator intencji z katalogu A–H albo ``OUT_OF_CATALOG`` dla pytań spoza katalogu."""

EngineVersion = Annotated[
    str, Field(pattern=r"^params-\d{4}-\d{2}-\d{2}$", examples=["params-2026-10-24"])
]
"""Identyfikator zestawu parametrów prawnych użytego do wyliczenia (ZUS-10)."""

LegalUrl = Annotated[
    str,
    Field(json_schema_extra={"format": "uri"}),
    AfterValidator(_check_legal_url),
]

SickLeaveCode = Annotated[str, Field(pattern=r"^[A-E]$")]
"""Kod literowy e-ZLA; „B” oznacza niezdolność do pracy w czasie ciąży."""
