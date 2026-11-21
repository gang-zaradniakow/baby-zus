import { addDays } from './calendarDate';
import { isDayOff } from './workingDays';

/** Kolejne dni robocze od jutra (bez weekendów i świąt) — np. terminy e-wizyty. */
export function nextWorkingDays(today: Date, count: number): Date[] {
  const days: Date[] = [];
  let day = addDays(today, 1);
  while (days.length < count) {
    if (!isDayOff(day)) days.push(day);
    day = addDays(day, 1);
  }
  return days;
}
