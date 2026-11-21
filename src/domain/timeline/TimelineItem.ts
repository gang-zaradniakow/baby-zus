import type { Deadline } from '@/domain/deadlines/Deadline';

/** Gdzie załatwia się sprawę. */
export type Institution = 'ZUS' | 'PRAC' | 'GMINA' | 'USC' | 'NFZ' | 'INFO';

/** Pozycja osi czasu wynikająca z reguł (jeszcze bez statusu). */
export type TimelineEntry = {
  id: string;
  title: string;
  description?: string;
  institution: Institution;
  /** Data, po której sortujemy (np. dzień zdarzenia lub planowany termin). */
  date: Date;
  deadline?: Deadline;
  /** Termin liczony od przewidywanej daty (np. termin porodu) — orientacyjny. */
  estimate?: boolean;
  /** Kamień milowy (koniec urlopu itp.) — informacja, nie zadanie. */
  milestone?: boolean;
};

/**
 * - `done`   — oznaczone przez użytkownika jako zrobione,
 * - `late`   — minął wiążący termin,
 * - `now`    — termin w ciągu 30 dni,
 * - `past`   — data minęła, ale nie było wiążącego terminu,
 * - `future` — później niż za 30 dni.
 */
export type TimelineStatus = 'done' | 'late' | 'now' | 'past' | 'future';

export type TimelineItem = TimelineEntry & {
  /** Dzień, do którego trzeba działać. */
  due: Date;
  /** Dni od dziś do `due` (ujemne = minęło). */
  daysLeft: number;
  status: TimelineStatus;
};
