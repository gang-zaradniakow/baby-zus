import { day } from '@/testing/dates';

import { addWeeks } from './calendarDate';
import { ageInMonths, ageLabel, pregnancyWeek } from './age';

const today = day(2026, 11, 21);

describe('pregnancyWeek', () => {
  it('termin za 16 tygodni = 24. tydzień ciąży', () => {
    expect(pregnancyWeek(addWeeks(today, 16), today)).toBe(24);
  });

  it('ogranicza wynik do zakresu 1–42', () => {
    expect(pregnancyWeek(addWeeks(today, 60), today)).toBe(1);
    expect(pregnancyWeek(addWeeks(today, -5), today)).toBe(42);
  });
});

describe('ageInMonths', () => {
  it('liczy pełne miesiące', () => {
    expect(ageInMonths(day(2026, 5, 21), today)).toBe(6);
    expect(ageInMonths(day(2026, 5, 22), today)).toBe(5);
  });

  it('nie zwraca wartości ujemnych', () => {
    expect(ageInMonths(day(2027, 1, 1), today)).toBe(0);
  });
});

describe('ageLabel', () => {
  it.each([
    [day(2026, 11, 1), '2 tyg. 6 dni'],
    [day(2026, 4, 21), '7 mies.'],
    [day(2024, 10, 21), '2 lata 1 mies.'],
    [day(2024, 11, 21), '2 lata'],
    [day(2021, 11, 21), '5 lat'],
    [day(2021, 10, 21), '5 lat 1 mies.'],
    [day(2026, 12, 1), 'jeszcze nie urodzone'],
  ])('urodzenie %s → „%s”', (birth, label) => {
    expect(ageLabel(birth, today)).toBe(label);
  });
});
