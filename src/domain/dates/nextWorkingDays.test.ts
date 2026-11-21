import { day } from '@/testing/dates';

import { toISODate } from './calendarDate';
import { nextWorkingDays } from './nextWorkingDays';

describe('nextWorkingDays', () => {
  it('od jutra, z pominięciem weekendu', () => {
    // 21.11.2026 to sobota.
    expect(nextWorkingDays(day(2026, 11, 21), 3).map(toISODate)).toEqual(['2026-11-23', '2026-11-24', '2026-11-25']);
  });

  it('pomija święta (Wigilia i Boże Narodzenie)', () => {
    expect(nextWorkingDays(day(2026, 12, 23), 2).map(toISODate)).toEqual(['2026-12-28', '2026-12-29']);
  });
});
