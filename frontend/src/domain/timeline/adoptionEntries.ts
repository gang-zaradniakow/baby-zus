import { addDays } from '@/domain/dates/calendarDate';
import { deadlineAfterDays } from '@/domain/deadlines/deadlines';

import type { TimelineContext } from './TimelineContext';
import type { TimelineEntry } from './TimelineItem';

/** Reguły osi czasu przy adopcji / rodzinie zastępczej. `eventDate` = data przyjęcia dziecka. */
export function adoptionEntries({ eventDate: taken, insurance }: TimelineContext): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      id: 'adop',
      title: 'Wniosek o urlop na warunkach urlopu macierzyńskiego',
      description: 'W ciągu 7 dni od przyjęcia dziecka.',
      institution: 'PRAC',
      date: addDays(taken, 7),
      deadline: deadlineAfterDays(taken, 7),
    },
    {
      id: 'adop-start',
      title: 'Najpóźniejszy początek urlopu (21 dni od przyjęcia)',
      institution: 'PRAC',
      date: addDays(taken, 21),
      milestone: true,
    },
  ];

  if (insurance.hasSicknessInsurance) {
    entries.push({
      id: 'w81a',
      title: 'Opcjonalnie: wariant 81,5% (21 dni od przyjęcia)',
      institution: 'PRAC',
      date: addDays(taken, 21),
      deadline: deadlineAfterDays(taken, 21),
    });
  }

  entries.push({
    id: 'pcpr',
    title: 'Dodatek wychowawczy (rodzina zastępcza) — PCPR / 800+ przy przysposobieniu — ZUS',
    institution: 'INFO',
    date: addDays(taken, 30),
  });

  return entries;
}
