/**
 * Operacje na datach kalendarzowych (bez godzin).
 * Każdą datę ustawiamy na 12:00 — zmiana czasu letni/zimowy (±1 h) nie przesunie wtedy dnia.
 */
const DAY_MS = 86_400_000;

export function atNoon(input: Date | number): Date {
  const date = new Date(input);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function today(): Date {
  return atNoon(new Date());
}

export function addDays(date: Date, days: number): Date {
  return atNoon(atNoon(date).getTime() + days * DAY_MS);
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/** Dodaje miesiące; 31.01 + 1 miesiąc = 28/29.02 (ostatni dzień krótszego miesiąca). */
export function addMonths(date: Date, months: number): Date {
  const result = atNoon(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return atNoon(result);
}

/** Ostatni dzień miesiąca, w którym leży `date`. */
export function endOfMonth(date: Date): Date {
  return atNoon(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

/** Liczba dni od `from` do `to` (dodatnia, gdy `to` jest później). */
export function diffDays(from: Date, to: Date): number {
  return Math.round((atNoon(to).getTime() - atNoon(from).getTime()) / DAY_MS);
}

export function isSameDay(a: Date, b: Date): boolean {
  return diffDays(a, b) === 0;
}

/** Zapis daty do przechowywania: `RRRR-MM-DD`. */
export function toISODate(date: Date): string {
  const d = atNoon(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function fromISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return atNoon(new Date(year, month - 1, day));
}
