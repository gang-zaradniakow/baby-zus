import { atNoon } from '@/domain/dates/calendarDate';

/** Czytelna data w testach: `day(2026, 11, 21)` = 21 listopada 2026, 12:00. */
export function day(year: number, month: number, dayOfMonth: number): Date {
  return atNoon(new Date(year, month - 1, dayOfMonth));
}
