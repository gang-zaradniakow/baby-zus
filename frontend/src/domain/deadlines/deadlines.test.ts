import { toISODate } from '@/domain/dates/calendarDate';
import { day } from '@/testing/dates';

import { deadlineAfterDays, deadlineAfterMonths, deadlineBeforeDays, deadlineOn } from './deadlines';

describe('deadlineAfterDays („w ciągu X dni od”)', () => {
  it('termin w niedzielę przesuwa się na poniedziałek', () => {
    const d = deadlineAfterDays(day(2026, 11, 1), 21);
    expect(toISODate(d.raw)).toBe('2026-11-22');
    expect(toISODate(d.legal)).toBe('2026-11-23');
    expect(d.shifted).toBe(true);
    expect(d.reason).toBe('niedziela');
    expect(d.kind).toBe('after');
  });

  it('termin w dzień roboczy się nie przesuwa; zalecamy dzień roboczy wcześniej', () => {
    const d = deadlineAfterDays(day(2026, 11, 2), 21);
    expect(toISODate(d.legal)).toBe('2026-11-23');
    expect(d.shifted).toBe(false);
    expect(d.reason).toBeNull();
    expect(toISODate(d.safe)).toBe('2026-11-20');
  });
});

describe('deadlineAfterMonths', () => {
  it('termin w święto (Wszystkich Świętych) przesuwa się na następny dzień roboczy', () => {
    const d = deadlineAfterMonths(day(2026, 11, 1), 12);
    expect(toISODate(d.legal)).toBe('2027-11-02');
    expect(d.reason).toBe('Wszystkich Świętych');
  });
});

describe('deadlineBeforeDays („najpóźniej X dni przed”)', () => {
  it('termin w sobotę NIE przesuwa się do przodu — zalecany jest piątek', () => {
    const d = deadlineBeforeDays(day(2027, 5, 8), 14);
    expect(d.kind).toBe('before');
    expect(toISODate(d.raw)).toBe('2027-04-24');
    expect(toISODate(d.legal)).toBe('2027-04-24');
    expect(toISODate(d.safe)).toBe('2027-04-23');
    expect(d.shifted).toBe(false);
    expect(d.reason).toBe('sobota');
  });
});

describe('deadlineOn', () => {
  it('sztywny termin bez przesuwania', () => {
    const d = deadlineOn(day(2027, 11, 30));
    expect(toISODate(d.legal)).toBe('2027-11-30');
    expect(d.shifted).toBe(false);
  });
});
