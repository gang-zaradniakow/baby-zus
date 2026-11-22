import { addDays, addMonths } from '@/domain/dates/calendarDate';
import { dayOffReason, nextWorkingDay, previousWorkingDay } from '@/domain/dates/workingDays';

import type { Deadline, DeadlineRule } from './Deadline';

/** Termin typu „po”: przesuwany na dzień roboczy; zalecamy złożyć dzień roboczy wcześniej. */
function afterFrom(raw: Date, rule: DeadlineRule): Deadline {
  const legal = nextWorkingDay(raw);
  const shifted = legal.getTime() !== raw.getTime();
  return {
    kind: 'after',
    raw,
    legal,
    safe: previousWorkingDay(addDays(legal, -1)),
    shifted,
    reason: shifted ? dayOffReason(raw) : null,
    rule,
  };
}

/** „W ciągu X dni od zdarzenia”. */
export function deadlineAfterDays(event: Date, days: number): Deadline {
  return afterFrom(addDays(event, days), { event, kind: 'after', days });
}

/** „W ciągu X miesięcy od zdarzenia”. */
export function deadlineAfterMonths(event: Date, months: number): Deadline {
  return afterFrom(addMonths(event, months), { event, kind: 'after', months });
}

/** „Nie później niż X dni przed zdarzeniem” — bez przesuwania do przodu. */
export function deadlineBeforeDays(event: Date, days: number): Deadline {
  const raw = addDays(event, -days);
  return {
    kind: 'before',
    raw,
    legal: raw,
    safe: previousWorkingDay(raw),
    shifted: false,
    reason: dayOffReason(raw),
    rule: { event, kind: 'before', days },
  };
}

/** Sztywny termin na konkretny dzień (np. koniec miesiąca), bez przesuwania. */
export function deadlineOn(date: Date): Deadline {
  return {
    kind: 'after',
    raw: date,
    legal: date,
    safe: previousWorkingDay(date),
    shifted: false,
    reason: null,
  };
}
