import { day } from '@/testing/dates';

import {
  addDays,
  addMonths,
  addWeeks,
  atNoon,
  diffDays,
  endOfMonth,
  fromISODate,
  isSameDay,
  toISODate,
} from './calendarDate';

describe('calendarDate', () => {
  it('atNoon ustawia godzinę 12:00 bez zmiany dnia', () => {
    const result = atNoon(new Date(2026, 10, 21, 23, 59));
    expect(result.getHours()).toBe(12);
    expect(result.getDate()).toBe(21);
  });

  it('addDays przechodzi przez granicę miesiąca i roku', () => {
    expect(toISODate(addDays(day(2026, 12, 30), 3))).toBe('2027-01-02');
    expect(toISODate(addDays(day(2026, 3, 1), -1))).toBe('2026-02-28');
  });

  it('addDays nie gubi dnia przy zmianie czasu (koniec marca)', () => {
    expect(toISODate(addDays(day(2026, 3, 28), 2))).toBe('2026-03-30');
  });

  it('addWeeks dodaje pełne tygodnie', () => {
    expect(toISODate(addWeeks(day(2026, 11, 1), 2))).toBe('2026-11-15');
  });

  it('addMonths przycina do ostatniego dnia krótszego miesiąca', () => {
    expect(toISODate(addMonths(day(2026, 1, 31), 1))).toBe('2026-02-28');
    expect(toISODate(addMonths(day(2028, 1, 31), 1))).toBe('2028-02-29');
    expect(toISODate(addMonths(day(2026, 11, 15), 3))).toBe('2027-02-15');
  });

  it('endOfMonth zwraca ostatni dzień miesiąca', () => {
    expect(toISODate(endOfMonth(day(2027, 2, 10)))).toBe('2027-02-28');
  });

  it('diffDays jest dodatnie dla późniejszej daty i ujemne dla wcześniejszej', () => {
    expect(diffDays(day(2026, 11, 21), day(2026, 11, 23))).toBe(2);
    expect(diffDays(day(2026, 11, 23), day(2026, 11, 21))).toBe(-2);
  });

  it('isSameDay porównuje tylko dzień', () => {
    expect(isSameDay(new Date(2026, 10, 21, 8), new Date(2026, 10, 21, 20))).toBe(true);
    expect(isSameDay(day(2026, 11, 21), day(2026, 11, 22))).toBe(false);
  });

  it('toISODate i fromISODate są odwrotne', () => {
    expect(toISODate(fromISODate('2027-03-05'))).toBe('2027-03-05');
  });
});
