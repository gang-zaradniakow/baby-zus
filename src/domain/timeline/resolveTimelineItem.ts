import { diffDays } from '@/domain/dates/calendarDate';

import type { TimelineEntry, TimelineItem, TimelineStatus } from './TimelineItem';

const SOON_DAYS = 30;

/** Dzień, do którego trzeba działać: przy terminie „przed” — data surowa, przy „po” — prawna. */
function dueDate(entry: TimelineEntry): Date {
  if (!entry.deadline) return entry.date;
  return entry.deadline.kind === 'before' ? entry.deadline.raw : entry.deadline.legal;
}

function statusOf(entry: TimelineEntry, daysLeft: number, done: boolean): TimelineStatus {
  if (done) return 'done';
  if (entry.deadline && daysLeft < 0 && !entry.estimate) return 'late';
  if (daysLeft >= 0 && daysLeft <= SOON_DAYS) return 'now';
  return daysLeft < 0 ? 'past' : 'future';
}

/** Dokłada do pozycji: termin, liczbę dni do niego i status. */
export function resolveTimelineItem(entry: TimelineEntry, today: Date, done: boolean): TimelineItem {
  const due = dueDate(entry);
  const daysLeft = diffDays(today, due);
  return { ...entry, due, daysLeft, status: statusOf(entry, daysLeft, done) };
}
