import { day } from '@/testing/dates';

import { toISODate } from './calendarDate';
import { dayOffReason, isDayOff, nextWorkingDay, previousWorkingDay } from './workingDays';

describe('workingDays', () => {
  it('weekend i święta są dniami wolnymi, z podanym powodem', () => {
    expect(dayOffReason(day(2026, 11, 21))).toBe('sobota');
    expect(dayOffReason(day(2026, 11, 22))).toBe('niedziela');
    expect(dayOffReason(day(2026, 11, 11))).toBe('Narodowe Święto Niepodległości');
    expect(isDayOff(day(2026, 11, 23))).toBe(false);
  });

  it('nextWorkingDay omija weekend', () => {
    expect(toISODate(nextWorkingDay(day(2026, 11, 21)))).toBe('2026-11-23');
  });

  it('nextWorkingDay omija ciąg świąt (Wigilia + Boże Narodzenie + weekend)', () => {
    expect(toISODate(nextWorkingDay(day(2026, 12, 24)))).toBe('2026-12-28');
  });

  it('previousWorkingDay cofa się do piątku', () => {
    expect(toISODate(previousWorkingDay(day(2026, 11, 22)))).toBe('2026-11-20');
  });

  it('dzień roboczy zostaje bez zmian', () => {
    expect(toISODate(nextWorkingDay(day(2026, 11, 23)))).toBe('2026-11-23');
    expect(toISODate(previousWorkingDay(day(2026, 11, 23)))).toBe('2026-11-23');
  });
});
