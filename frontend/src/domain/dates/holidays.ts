import { addDays, atNoon, isSameDay } from './calendarDate';

export type Holiday = {
  date: Date;
  name: string;
};

/** Niedziela Wielkanocna — algorytm Meeusa/Jonesa/Butchera. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return atNoon(new Date(year, month - 1, day));
}

const cache = new Map<number, readonly Holiday[]>();

/** Ustawowe dni wolne w Polsce (od 2025 r. także Wigilia). */
export function holidaysInYear(year: number): readonly Holiday[] {
  const cached = cache.get(year);
  if (cached) return cached;

  const easter = easterSunday(year);
  const fixed = (month: number, day: number) => atNoon(new Date(year, month - 1, day));

  const list: Holiday[] = [
    { date: fixed(1, 1), name: 'Nowy Rok' },
    { date: fixed(1, 6), name: 'Trzech Króli' },
    { date: easter, name: 'Wielkanoc' },
    { date: addDays(easter, 1), name: 'Poniedziałek Wielkanocny' },
    { date: fixed(5, 1), name: 'Święto Pracy' },
    { date: fixed(5, 3), name: 'Święto Konstytucji 3 Maja' },
    { date: addDays(easter, 49), name: 'Zielone Świątki' },
    { date: addDays(easter, 60), name: 'Boże Ciało' },
    { date: fixed(8, 15), name: 'Wniebowzięcie NMP' },
    { date: fixed(11, 1), name: 'Wszystkich Świętych' },
    { date: fixed(11, 11), name: 'Narodowe Święto Niepodległości' },
    { date: fixed(12, 25), name: 'Boże Narodzenie (1. dzień)' },
    { date: fixed(12, 26), name: 'Boże Narodzenie (2. dzień)' },
  ];
  if (year >= 2025) list.push({ date: fixed(12, 24), name: 'Wigilia (od 2025 r.)' });

  list.sort((x, y) => x.date.getTime() - y.date.getTime());
  cache.set(year, list);
  return list;
}

export function holidayName(date: Date): string | null {
  const found = holidaysInYear(date.getFullYear()).find((h) => isSameDay(h.date, date));
  return found ? found.name : null;
}
