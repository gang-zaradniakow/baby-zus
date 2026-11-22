"""Walidator tekstu LLM (ZUS-53): żadna liczba ani przepis spoza karty silnika nie przechodzi.

Dozwolone wartości pochodzą z karty: z pól liczbowych (podstawa, kwoty, stawki, daty okresów,
długości okresów) i z tekstów karty napisanych przez silnik (fakty, ostrzeżenia, szablon
podsumowania). Porównujemy wartości, nie napisy – „4 922,84 zł” = „4922,84 zł” = 4922.84.

Przepisy: dozwolone są artykuły z rejestru podstaw prawnych silnika (``rules_engine.legal``)
i z dodatkowych źródeł (fragmenty RAG, ZUS-55). Małe liczby bez jednostki (0–10, np. „2 dzieci”,
„w 5 częściach”) są dozwolone – to słowa liczebników, nie wyniki wyliczeń.
"""

from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal
from typing import Final, Protocol

from assistant.numbers import Kind, Token, extract, normalize_article
from contracts import AnswerCard
from rules_engine.legal.refs import INTENT_LEGAL_BASIS

SMALL_COUNT: Final = Decimal(10)
DAYS_PER_WEEK: Final = 7


class SummaryValidator(Protocol):
    def problems(self, summary: str, card: AnswerCard) -> list[str]:
        """Lista problemów (pusta = tekst zgodny z kartą). Opisy bez danych użytkownika."""
        ...


class AcceptAllValidator:
    """Brak sprawdzania – tylko do testów orkiestratora, nigdy na produkcji."""

    def problems(self, summary: str, card: AnswerCard) -> list[str]:
        return []


@dataclass
class Allowed:
    amounts: set[Decimal] = field(default_factory=set)
    percents: set[Decimal] = field(default_factory=set)
    dates: set[date] = field(default_factory=set)
    months: set[str] = field(default_factory=set)
    days: set[Decimal] = field(default_factory=set)
    month_counts: set[Decimal] = field(default_factory=set)
    numbers: set[Decimal] = field(default_factory=set)
    articles: set[str] = field(default_factory=set)

    def add_text(self, text: str) -> None:
        for token in extract(text):
            self.add(token)

    def add(self, token: Token) -> None:
        match token.kind, token.value:
            case Kind.AMOUNT, Decimal() as value:
                self.amounts.add(value)
            case Kind.PERCENT, Decimal() as value:
                self.percents.add(value)
            case Kind.DATE, date() as value:
                self.add_date(value)
            case Kind.MONTH, str() as value:
                self.months.add(value)
            case Kind.DAYS, Decimal() as value:
                self.days.add(value)
            case Kind.MONTHS, Decimal() as value:
                self.month_counts.add(value)
            case Kind.ARTICLE, str() as value:
                self.articles.add(value)
            case ((Kind.YEAR | Kind.NUMBER), Decimal() as value):
                self.numbers.add(value)
            case _:
                pass  # niepoprawna data w tekście karty – nic nie dopuszcza

    def add_date(self, day: date) -> None:
        self.dates.add(day)
        self.months.add(f"{day.year:04d}-{day.month:02d}")
        self.numbers.add(Decimal(day.year))

    @property
    def all_numbers(self) -> set[Decimal]:
        return (
            self.amounts
            | self.percents
            | self.days
            | {d / DAYS_PER_WEEK for d in self.days}
            | self.month_counts
            | self.numbers
        )


def _registry_articles() -> set[str]:
    return {
        token.value
        for bases in INTENT_LEGAL_BASIS.values()
        for basis in bases
        for token in extract(basis.article)
        if token.kind is Kind.ARTICLE and isinstance(token.value, str)
    }


REGISTRY_ARTICLES: Final = frozenset(_registry_articles())


def allowed_from_card(card: AnswerCard) -> Allowed:
    allowed = Allowed(articles=set(REGISTRY_ARTICLES))
    texts = [card.summary, *card.warnings, *card.alternatives]
    texts += [f"{fact.label}: {fact.value}" for fact in card.facts]
    texts += [missing.question for missing in card.missing]
    texts += [ref.article for ref in card.legal_basis]
    calculation = card.calculation
    if calculation is not None:
        texts += calculation.assumptions
        for amount in (calculation.base, calculation.monthly, calculation.total):
            if amount is not None:
                allowed.amounts.add(amount)
        if calculation.rate is not None:
            allowed.percents.add(calculation.rate * 100)
        for period in calculation.periods:
            allowed.add_date(period.date_from)
            allowed.add_date(period.date_to)
            # Dzień po końcu okresu („od 01.04.2027” po macierzyńskim do 31.03.2027).
            allowed.add_date(period.date_to + timedelta(days=1))
            allowed.days.add(Decimal((period.date_to - period.date_from).days + 1))
            for value in (period.amount, period.monthly):
                if value is not None:
                    allowed.amounts.add(value)
            if period.rate is not None:
                allowed.percents.add(period.rate * 100)
    for text in texts:
        allowed.add_text(text)
    return allowed


def _same(value: Decimal, options: set[Decimal]) -> bool:
    return any(value == option for option in options)


def check_text(text: str, allowed: Allowed) -> list[str]:
    """Problemy w tekście względem dozwolonych wartości (bez powtórzeń, w kolejności)."""
    problems: list[str] = []
    for token in extract(text):
        problem = _check(token, allowed)
        if problem and problem not in problems:
            problems.append(problem)
    return problems


def _check(token: Token, allowed: Allowed) -> str | None:
    value = token.value
    ok: bool
    match token.kind:
        case Kind.ARTICLE:
            return None if value in allowed.articles else f"przepis spoza podstawy: {token.text}"
        case Kind.DATE:
            ok = isinstance(value, date) and value in allowed.dates
            label = "data"
        case Kind.MONTH:
            ok = value in allowed.months
            label = "miesiąc"
        case Kind.AMOUNT:
            ok = isinstance(value, Decimal) and _same(value, allowed.amounts)
            label = "kwota"
        case Kind.PERCENT:
            ok = isinstance(value, Decimal) and _same(value, allowed.percents)
            label = "procent"
        case Kind.DAYS:
            ok = isinstance(value, Decimal) and _same(value, allowed.days)
            label = "okres"
        case Kind.MONTHS:
            ok = isinstance(value, Decimal) and _same(value, allowed.month_counts)
            label = "okres"
        case _:  # YEAR, NUMBER
            ok = isinstance(value, Decimal) and (
                value <= SMALL_COUNT or _same(value, allowed.all_numbers)
            )
            label = "liczba"
    return None if ok else f"{label} spoza karty: {token.text.strip()}"


class NumberValidator:
    """Walidator produkcyjny: liczby i przepisy wyłącznie z karty (+ źródła RAG)."""

    def __init__(self, extra_articles: Iterable[str] = ()) -> None:
        self._extra = {normalize_article(a) for a in extra_articles}

    def problems(self, summary: str, card: AnswerCard) -> list[str]:
        allowed = allowed_from_card(card)
        allowed.articles |= self._extra
        return check_text(summary, allowed)
