import type { TimelineItem } from '@/domain/timeline/TimelineItem';

import { day } from './dates';

/** Pozycja osi czasu do testów komponentów; nadpisz tylko to, co ważne w teście. */
export function makeTimelineItem(overrides: Partial<TimelineItem> = {}): TimelineItem {
  return {
    id: 'usc-zgloszenie',
    title: 'Zgłoś urodzenie dziecka',
    institution: 'USC',
    date: day(2026, 12, 1),
    due: day(2026, 12, 1),
    daysLeft: 60,
    status: 'future',
    ...overrides,
  };
}
