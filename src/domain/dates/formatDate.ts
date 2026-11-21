import { atNoon } from './calendarDate';

const WEEKDAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'] as const;

export function weekdayName(date: Date): string {
  return WEEKDAYS[atNoon(date).getDay()];
}

/** `DD.MM.RRRR`, opcjonalnie z dniem tygodnia: `24.12.2026 (czwartek)`. */
export function formatDate(date: Date, withWeekday = false): string {
  const d = atNoon(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const text = `${day}.${month}.${d.getFullYear()}`;
  return withWeekday ? `${text} (${weekdayName(d)})` : text;
}
