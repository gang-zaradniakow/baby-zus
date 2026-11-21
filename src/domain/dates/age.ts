import { atNoon, diffDays } from './calendarDate';

/** Tydzień ciąży (1–42) wyliczony z terminu porodu (termin = koniec 40. tygodnia). */
export function pregnancyWeek(dueDate: Date, today: Date): number {
  const weeksToDue = Math.ceil(diffDays(today, dueDate) / 7);
  return Math.max(1, Math.min(42, 40 - weeksToDue));
}

/** Pełne miesiące życia dziecka. */
export function ageInMonths(birthDate: Date, today: Date): number {
  const b = atNoon(birthDate);
  const t = atNoon(today);
  let months = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
  if (t.getDate() < b.getDate()) months--;
  return Math.max(0, months);
}

/** Wiek dziecka po ludzku: „3 tyg. 2 dni”, „7 mies.”, „2 lata 1 mies.”. */
export function ageLabel(birthDate: Date, today: Date): string {
  const days = diffDays(birthDate, today);
  if (days < 0) return 'jeszcze nie urodzone';
  if (days < 60) return `${Math.floor(days / 7)} tyg. ${days % 7} dni`;

  const months = ageInMonths(birthDate, today);
  if (months < 24) return `${months} mies.`;

  const years = Math.floor(months / 12);
  const rest = months % 12;
  return `${years} ${years < 5 ? 'lata' : 'lat'}${rest ? ` ${rest} mies.` : ''}`;
}
