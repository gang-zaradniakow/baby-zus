import { ageLabel, pregnancyWeek } from '@/domain/dates/age';
import { fromISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';

import type { ParentProfile } from './ParentProfile';

/** Jednolinijkowy opis sytuacji, np. „Ciąża · 24. tydzień · termin 12.03.2027”. */
export function describeStage(profile: ParentProfile, today: Date): string {
  const date = fromISODate(profile.eventDate);

  switch (profile.stage) {
    case 'ciaza':
      return `Ciąża · ${pregnancyWeek(date, today)}. tydzień · termin ${formatDate(date)}`;
    case 'dziecko':
      return `Dziecko · ${ageLabel(date, today)}`;
    case 'adopcja':
      return `Przyjęcie dziecka · ${formatDate(date)}`;
  }
}
