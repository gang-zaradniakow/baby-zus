"""Okresy ubezpieczenia chorobowego: scalanie, stan w danym dniu, okres wyczekiwania."""

from collections.abc import Iterable, Iterator
from datetime import date, timedelta
from typing import Final

from contracts import InsurancePeriod, InsuranceTitle, SicknessInsurance

#: Przerwa (w dniach), po której poprzednie okresy nadal wlicza się do okresu wyczekiwania.
MAX_GAP_DAYS: Final = 30

type Span = tuple[date, date]


def merged_sickness_spans(periods: Iterable[InsurancePeriod]) -> list[Span]:
    """Scalone, ciągłe okresy ubezpieczenia chorobowego; brak końca = ``date.max``."""
    return list(_merge(periods))


def _merge(periods: Iterable[InsurancePeriod]) -> Iterator[Span]:
    spans = sorted(
        (p.date_from, p.date_to or date.max)
        for p in periods
        if p.sickness is not SicknessInsurance.NONE
    )
    current: Span | None = None
    for start, end in spans:
        if current and (current[1] == date.max or start <= current[1] + timedelta(days=1)):
            current = (current[0], max(current[1], end))
        else:
            if current:
                yield current
            current = (start, end)
    if current:
        yield current


def periods_on(day: date, periods: Iterable[InsurancePeriod]) -> list[InsurancePeriod]:
    """Okresy (dowolnego tytułu) obejmujące dany dzień."""
    return [p for p in periods if p.date_from <= day <= (p.date_to or date.max)]


def titles_on(day: date, periods: Iterable[InsurancePeriod]) -> set[InsuranceTitle]:
    return {p.title for p in periods_on(day, periods)}


def sickness_insured_on(day: date, periods: Iterable[InsurancePeriod]) -> bool:
    return any(p.sickness is not SicknessInsurance.NONE for p in periods_on(day, periods))


def sickness_kind_on(day: date, periods: Iterable[InsurancePeriod]) -> SicknessInsurance:
    """Rodzaj ubezpieczenia chorobowego w dniu (obowiązkowe ma pierwszeństwo)."""
    kinds = {p.sickness for p in periods_on(day, periods)}
    for kind in (SicknessInsurance.MANDATORY, SicknessInsurance.VOLUNTARY):
        if kind in kinds:
            return kind
    return SicknessInsurance.NONE


def insured_days_before(day: date, periods: Iterable[InsurancePeriod]) -> int | None:
    """Dni ubezpieczenia chorobowego przed ``day`` liczone do okresu wyczekiwania.

    Wlicza poprzednie okresy, jeśli przerwa między nimi nie przekroczyła 30 dni (dni przerwy
    się nie liczą). ``None`` – w dniu ``day`` brak ubezpieczenia chorobowego.
    Nie uwzględnia innych przerw wliczanych (urlop wychowawczy, bezpłatny, służba wojskowa).
    """
    spans = merged_sickness_spans(periods)
    current = next((s for s in spans if s[0] <= day <= s[1]), None)
    if current is None:
        return None
    total = (day - current[0]).days
    chain_start = current[0]
    for start, end in reversed([s for s in spans if s[1] < current[0]]):
        gap = (chain_start - end).days - 1
        if gap > MAX_GAP_DAYS:
            break
        total += (end - start).days + 1
        chain_start = start
    return total


def latest_start(periods: Iterable[InsurancePeriod]) -> date | None:
    starts = [p.date_from for p in periods]
    return max(starts) if starts else None
