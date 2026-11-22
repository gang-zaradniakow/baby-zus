import { day } from '@/testing/dates';

import { formatDate, weekdayName } from './formatDate';

describe('formatDate', () => {
  it('formatuje jako DD.MM.RRRR z zerami wiodącymi', () => {
    expect(formatDate(day(2027, 3, 5))).toBe('05.03.2027');
  });

  it('opcjonalnie dodaje dzień tygodnia', () => {
    expect(formatDate(day(2026, 12, 24), true)).toBe('24.12.2026 (czwartek)');
  });

  it('weekdayName zwraca polską nazwę dnia', () => {
    expect(weekdayName(day(2026, 11, 22))).toBe('niedziela');
  });
});
