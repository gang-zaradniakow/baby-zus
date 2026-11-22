import { addMonths, addWeeks } from '@/domain/dates/calendarDate';
import { parsePolishDate } from '@/domain/dates/parsePolishDate';

import type { ParentStage } from './ParentProfile';

export type EventDateValidation = {
  /** Poprawna data albo `null`. */
  date: Date | null;
  /** Komunikat dla użytkownika; `null`, gdy wszystko OK lub data jeszcze niewpisana do końca. */
  error: string | null;
};

const COMPLETE_LENGTH = 'DD.MM.RRRR'.length;
const MAX_PREGNANCY_WEEKS = 42;
const APP_SCOPE_MONTHS = 36;
const PLANNING_SCOPE_MONTHS = 36;

/** Sprawdza datę z onboardingu w kontekście etapu (termin porodu w przyszłości, urodzenie w przeszłości). */
export function validateEventDate(stage: ParentStage | null, text: string, today: Date): EventDateValidation {
  if (text.length < COMPLETE_LENGTH) return { date: null, error: null };

  const date = parsePolishDate(text);
  if (!date) return { date: null, error: 'Taka data nie istnieje. Sprawdź dzień i miesiąc.' };

  if (stage === 'planuje') {
    if (date < today) return { date: null, error: 'Planowany termin powinien być w przyszłości.' };
    if (date > addMonths(today, PLANNING_SCOPE_MONTHS)) {
      return { date: null, error: 'Podaj termin w ciągu najbliższych 3 lat.' };
    }
    return { date, error: null };
  }

  if (stage === 'ciaza') {
    if (date < today) {
      return { date: null, error: 'Termin porodu nie może być w przeszłości. Jeśli maluch już jest na świecie, wróć i zmień etap.' };
    }
    if (date > addWeeks(today, MAX_PREGNANCY_WEEKS)) {
      return { date: null, error: 'Termin porodu powinien przypadać w ciągu najbliższych 42 tygodni.' };
    }
    return { date, error: null };
  }

  if (date > today) return { date: null, error: 'Ta data nie może być z przyszłości.' };
  if (date < addMonths(today, -APP_SCOPE_MONTHS)) {
    return { date: null, error: 'Aplikacja obejmuje okres do 3. urodzin dziecka — podaj datę z ostatnich 3 lat.' };
  }
  return { date, error: null };
}
