"""Pomocnicze klasy do testów API (bez logiki biznesowej)."""

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

START = datetime(2026, 11, 22, 9, 0, tzinfo=UTC)


@dataclass
class FakeClock:
    """Zegar sterowany z testu – podawany do ``create_app(clock=...)``."""

    now: datetime = START

    def __call__(self) -> datetime:
        return self.now

    def advance(self, **delta: float) -> None:
        self.now += timedelta(**delta)
