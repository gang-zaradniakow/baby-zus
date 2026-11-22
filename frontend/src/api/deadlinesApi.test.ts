import { fromISODate, toISODate } from '@/domain/dates/calendarDate';
import type { Deadline } from '@/domain/deadlines/Deadline';
import { deadlineAfterDays, deadlineAfterMonths, deadlineBeforeDays } from '@/domain/deadlines/deadlines';

import golden from './__fixtures__/goldenDeadlines.json';
import { resetApiConfigForTests } from './apiConfig';
import type { DeadlineDto } from './apiTypes';
import { deadlineRuleKey, fetchDeadline, toDeadline } from './deadlinesApi';

const realFetch = globalThis.fetch;

const localFor = (kind: string, event: Date, amount: number): Deadline =>
  kind === 'DAYS_AFTER'
    ? deadlineAfterDays(event, amount)
    : kind === 'MONTHS_AFTER'
      ? deadlineAfterMonths(event, amount)
      : deadlineBeforeDays(event, amount);

/** Termin w zapisie złotego pliku backendu (`reason: null`, gdy dzień nie jest wolny). */
const asGolden = (d: Deadline) => ({
  type: d.kind === 'before' ? 'BEFORE' : 'AFTER',
  raw: toISODate(d.raw),
  legal: toISODate(d.legal),
  shifted: d.shifted,
  reason: d.reason,
  safe: toISODate(d.safe),
});

afterEach(() => {
  globalThis.fetch = realFetch;
  process.env.EXPO_PUBLIC_API_URL = '';
  resetApiConfigForTests();
});

describe('terminy: zgodność z backendem (golden/deadlines.json z baby-zus-backend)', () => {
  it.each(golden.cases)('$name', ({ input, expected }) => {
    const local = localFor(input.kind, fromISODate(input.event), input.amount);

    // Offline liczymy dokładnie tak jak serwer — także przesunięcia na święta i nazwy dni wolnych.
    expect(asGolden(local)).toEqual(expected);
    // Odpowiedź serwera (API pomija puste `reason`) mapuje się na ten sam termin.
    const { reason, ...rest } = expected;
    const dto = { ...rest, ...(reason && { reason }) } as DeadlineDto;
    expect(toDeadline(dto, local.rule!)).toEqual(local);
  });
});

describe('fetchDeadline', () => {
  it('wysyła event, type i days / months zgodnie z kontraktem', async () => {
    resetApiConfigForTests();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
    const urls: string[] = [];
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return {
        ok: true,
        json: async () => ({ type: 'AFTER', raw: '2026-12-24', legal: '2026-12-28', safe: '2026-12-23', shifted: true }),
      } as Response;
    }) as typeof fetch;

    const event = fromISODate('2026-12-03');
    const result = await fetchDeadline({ event, kind: 'after', days: 21 });
    await fetchDeadline({ event, kind: 'after', months: 3 });
    await fetchDeadline({ event, kind: 'before', days: 21 });

    expect(urls).toEqual([
      'https://api.test/api/v1/deadlines?event=2026-12-03&type=AFTER&days=21',
      'https://api.test/api/v1/deadlines?event=2026-12-03&type=AFTER&months=3',
      'https://api.test/api/v1/deadlines?event=2026-12-03&type=BEFORE&days=21',
    ]);
    expect(toISODate(result.legal)).toBe('2026-12-28');
    expect(result.reason).toBeNull(); // pole pominięte w odpowiedzi
  });

  it('klucz reguły rozróżnia dni i miesiące', () => {
    const event = fromISODate('2026-12-03');
    expect(deadlineRuleKey({ event, kind: 'after', days: 3 })).not.toBe(deadlineRuleKey({ event, kind: 'after', months: 3 }));
  });
});
