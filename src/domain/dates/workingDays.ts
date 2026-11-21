import { addDays, atNoon } from './calendarDate';
import { holidayName } from './holidays';

const SUNDAY = 0;
const SATURDAY = 6;

/** Powód, dla którego dzień jest wolny („sobota”, „Boże Ciało”…), albo `null` dla dnia roboczego. */
export function dayOffReason(date: Date): string | null {
  const d = atNoon(date);
  const holiday = holidayName(d);
  if (holiday) return holiday;
  if (d.getDay() === SATURDAY) return 'sobota';
  if (d.getDay() === SUNDAY) return 'niedziela';
  return null;
}

export function isDayOff(date: Date): boolean {
  return dayOffReason(date) !== null;
}

export function nextWorkingDay(date: Date): Date {
  let d = atNoon(date);
  while (isDayOff(d)) d = addDays(d, 1);
  return d;
}

export function previousWorkingDay(date: Date): Date {
  let d = atNoon(date);
  while (isDayOff(d)) d = addDays(d, -1);
  return d;
}
