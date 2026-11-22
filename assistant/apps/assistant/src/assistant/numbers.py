"""Wyłuskiwanie liczb z polskiego tekstu (ZUS-53, TL-20): kwoty, procenty, daty, okresy, przepisy.

Formy rozpoznawane jako ta sama wartość: „4 890 zł”, „4890,00 zł”, „4 890,00 PLN” (spacja,
twarda spacja albo wąska twarda spacja jako separator tysięcy); „81,5%”, „81,5 proc.”;
„03.12.2026”, „2026-12-03”, „3 grudnia 2026”; „20 tyg.”, „20 tygodni” (= 140 dni), „21 dni”,
„12 mies.”. Odwołania do przepisów („art. 31”, „art. 182¹a § 1”) są osobnym rodzajem –
liczba w „art. 31” nie jest kwotą ani okresem.
"""

import re
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from enum import StrEnum
from typing import Final


class Kind(StrEnum):
    ARTICLE = "ARTICLE"
    DATE = "DATE"
    MONTH = "MONTH"
    AMOUNT = "AMOUNT"
    PERCENT = "PERCENT"
    DAYS = "DAYS"
    """Okres w dniach (tygodnie przeliczone × 7)."""
    MONTHS = "MONTHS"
    """Okres w miesiącach."""
    YEAR = "YEAR"
    NUMBER = "NUMBER"


@dataclass(frozen=True, slots=True)
class Token:
    kind: Kind
    value: Decimal | date | str
    text: str


SEP: Final = r"[   ]"
NUM: Final = rf"\d{{1,3}}(?:{SEP}\d{{3}})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?"
MONTH_NAMES: Final = [
    "stycznia",
    "lutego",
    "marca",
    "kwietnia",
    "maja",
    "czerwca",
    "lipca",
    "sierpnia",
    "września",
    "października",
    "listopada",
    "grudnia",
]
SUPERSCRIPTS: Final = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹", "0123456789")

ARTICLE_RE: Final = re.compile(
    r"\bart\.?\s*(\d+[⁰¹²³⁴⁵⁶⁷⁸⁹]*[a-z]?)"
    r"(?:\s*§\s*\d+[a-z]?(?:\s*[–-]\s*\d+)?)?(?:\s*ust\.\s*\d+)?(?:\s*pkt\s*\d+)?",
    re.IGNORECASE,
)
DATE_DOTS_RE: Final = re.compile(r"\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b(?:\s*r\.)?")
DATE_ISO_RE: Final = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")
DATE_WORDS_RE: Final = re.compile(
    rf"\b(\d{{1,2}})\s+({'|'.join(MONTH_NAMES)})\s+(\d{{4}})\b(?:\s*r\.)?", re.IGNORECASE
)
MONTH_RE: Final = re.compile(r"\b(\d{4})-(\d{2})\b")
AMOUNT_RE: Final = re.compile(rf"({NUM})\s*(?:zł|złotych|złote|złoty|PLN)", re.IGNORECASE)
PERCENT_RE: Final = re.compile(rf"({NUM})\s*(?:%|proc\.|procent\w*)", re.IGNORECASE)
WEEKS_RE: Final = re.compile(rf"({NUM})\s*(?:tygodni\w*|tygodnie|tydzień|tyg\.?)", re.IGNORECASE)
DAYS_RE: Final = re.compile(rf"({NUM})\s*(?:dni|dzień|dnia)\b", re.IGNORECASE)
MONTHS_RE: Final = re.compile(rf"({NUM})\s*(?:miesięcy|miesiąc\w*|mies\.?)", re.IGNORECASE)
YEAR_RE: Final = re.compile(r"\b(19\d{2}|20\d{2})\b")
NUMBER_RE: Final = re.compile(rf"(?<![\w.,])({NUM})(?![\w])")


def to_decimal(text: str) -> Decimal:
    """Liczba dopasowana wzorcem ``NUM`` – zawsze poprawna po usunięciu separatorów."""
    return Decimal(re.sub(SEP, "", text).replace(",", "."))


def normalize_article(raw: str) -> str:
    """„182¹a” → „182^1a”: jedna postać niezależnie od zapisu indeksu górnego."""
    base = re.match(r"(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([a-z]?)", raw.lower())
    if base is None:  # pragma: no cover – wzorzec gwarantuje cyfrę na początku
        return raw.lower()
    number, sup, letter = base.groups()
    return number + (f"^{sup.translate(SUPERSCRIPTS)}" if sup else "") + letter


def _safe_date(year: int, month: int, day: int) -> date | None:
    try:
        return date(year, month, day)
    except ValueError:
        return None


Builder = Callable[[re.Match[str]], Token]


class _Scanner:
    def __init__(self, text: str) -> None:
        self.text = text
        self.tokens: list[Token] = []

    def take(self, pattern: re.Pattern[str], build: Builder) -> None:
        def replace(match: re.Match[str]) -> str:
            self.tokens.append(build(match))
            return " " * len(match.group(0))

        self.text = pattern.sub(replace, self.text)


def _date_token(match: re.Match[str], day: date | None) -> Token:
    # Niemożliwa data (np. 31.02) zostaje oznaczona jako napis – zawsze spoza karty.
    return Token(Kind.DATE, day if day is not None else match.group(0), match.group(0))


def _number(kind: Kind, scale: int = 1) -> Builder:
    def build(match: re.Match[str]) -> Token:
        return Token(kind, to_decimal(match.group(1)) * scale, match.group(0))

    return build


def extract(text: str) -> list[Token]:
    """Tokeny w kolejności rodzajów (przepisy i daty przed liczbami – bez podwójnego liczenia)."""
    scan = _Scanner(text)
    scan.take(ARTICLE_RE, lambda m: Token(Kind.ARTICLE, normalize_article(m.group(1)), m.group(0)))
    scan.take(
        DATE_DOTS_RE,
        lambda m: _date_token(m, _safe_date(int(m.group(3)), int(m.group(2)), int(m.group(1)))),
    )
    scan.take(
        DATE_ISO_RE,
        lambda m: _date_token(m, _safe_date(int(m.group(1)), int(m.group(2)), int(m.group(3)))),
    )
    scan.take(
        DATE_WORDS_RE,
        lambda m: _date_token(
            m,
            _safe_date(int(m.group(3)), MONTH_NAMES.index(m.group(2).lower()) + 1, int(m.group(1))),
        ),
    )
    scan.take(MONTH_RE, lambda m: Token(Kind.MONTH, f"{m.group(1)}-{m.group(2)}", m.group(0)))
    scan.take(AMOUNT_RE, _number(Kind.AMOUNT))
    scan.take(PERCENT_RE, _number(Kind.PERCENT))
    scan.take(WEEKS_RE, _number(Kind.DAYS, scale=7))
    scan.take(DAYS_RE, _number(Kind.DAYS))
    scan.take(MONTHS_RE, _number(Kind.MONTHS))
    scan.take(YEAR_RE, lambda m: Token(Kind.YEAR, Decimal(m.group(1)), m.group(0)))
    scan.take(NUMBER_RE, _number(Kind.NUMBER))
    return scan.tokens
