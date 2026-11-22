import { toISODate } from '@/domain/dates/calendarDate';
import { day } from '@/testing/dates';

import { validateChildBirthDate } from './validateChildBirthDate';

const today = day(2026, 11, 21);
const accepted = day(2026, 10, 1);

describe('validateChildBirthDate', () => {
  it('niepełny tekst nie jest ani poprawny, ani błędny', () => {
    expect(validateChildBirthDate('15.03', accepted, today)).toEqual({ date: null, error: null });
  });

  it('nieistniejąca data daje komunikat', () => {
    expect(validateChildBirthDate('31.02.2024', accepted, today).error).toMatch(/nie istnieje/);
  });

  it('przyjmuje datę przed przyjęciem dziecka', () => {
    const result = validateChildBirthDate('10.05.2022', accepted, today);
    expect(result.error).toBeNull();
    expect(toISODate(result.date!)).toBe('2022-05-10');
  });

  it('przyjmuje datę równą dacie przyjęcia', () => {
    expect(validateChildBirthDate('01.10.2026', accepted, today).date).not.toBeNull();
  });

  it('odrzuca datę z przyszłości', () => {
    expect(validateChildBirthDate('01.12.2026', null, today).error).toMatch(/z przyszłości/);
  });

  it('odrzuca datę późniejszą niż przyjęcie', () => {
    expect(validateChildBirthDate('02.10.2026', accepted, today).error).toMatch(/przed datą przyjęcia/);
  });
});
