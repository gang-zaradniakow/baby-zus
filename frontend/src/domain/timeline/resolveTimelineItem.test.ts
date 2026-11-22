import { toISODate } from '@/domain/dates/calendarDate';
import { deadlineAfterDays, deadlineBeforeDays } from '@/domain/deadlines/deadlines';
import { day } from '@/testing/dates';

import { resolveTimelineItem } from './resolveTimelineItem';
import type { TimelineEntry } from './TimelineItem';

const today = day(2026, 11, 21);
const entry = (overrides: Partial<TimelineEntry>): TimelineEntry => ({
  id: 'x',
  title: 'Test',
  institution: 'ZUS',
  date: today,
  ...overrides,
});

describe('resolveTimelineItem', () => {
  it('zrobione zadanie ma status done niezależnie od daty', () => {
    const item = resolveTimelineItem(entry({ date: day(2020, 1, 1), deadline: deadlineAfterDays(day(2020, 1, 1), 1) }), today, true);
    expect(item.status).toBe('done');
  });

  it('miniony wiążący termin = late', () => {
    const item = resolveTimelineItem(entry({ deadline: deadlineAfterDays(day(2026, 10, 1), 21) }), today, false);
    expect(item.status).toBe('late');
    expect(item.daysLeft).toBeLessThan(0);
  });

  it('miniony termin szacunkowy nie jest „po terminie”, tylko past', () => {
    const item = resolveTimelineItem(
      entry({ deadline: deadlineAfterDays(day(2026, 10, 1), 21), estimate: true }),
      today,
      false,
    );
    expect(item.status).toBe('past');
  });

  it('miniona data bez terminu = past', () => {
    expect(resolveTimelineItem(entry({ date: day(2026, 11, 1) }), today, false).status).toBe('past');
  });

  it.each([
    [0, 'now'],
    [30, 'now'],
    [31, 'future'],
  ])('termin za %i dni = %s', (days, status) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    expect(resolveTimelineItem(entry({ date }), today, false).status).toBe(status);
  });

  it('przy terminie „po” liczy do daty prawnej (po przesunięciu)', () => {
    const item = resolveTimelineItem(entry({ deadline: deadlineAfterDays(day(2026, 11, 1), 21) }), today, false);
    expect(toISODate(item.due)).toBe('2026-11-23');
    expect(item.daysLeft).toBe(2);
  });

  it('przy terminie „przed” liczy do daty surowej (bez przesuwania)', () => {
    const item = resolveTimelineItem(entry({ deadline: deadlineBeforeDays(day(2027, 5, 8), 14) }), today, false);
    expect(toISODate(item.due)).toBe('2027-04-24');
  });
});
