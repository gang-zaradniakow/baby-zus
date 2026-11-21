import { parsePolishDate } from '@/domain/dates/parsePolishDate';

import type { EventDateValidation } from './validateEventDate';

const COMPLETE_LENGTH = 'DD.MM.RRRR'.length;

/**
 * Sprawdza datę urodzenia przyjętego dziecka (adopcja / rodzina zastępcza):
 * nie z przyszłości i nie później niż data przyjęcia (gdy już ją znamy).
 */
export function validateChildBirthDate(text: string, acceptanceDate: Date | null, today: Date): EventDateValidation {
  if (text.length < COMPLETE_LENGTH) return { date: null, error: null };

  const date = parsePolishDate(text);
  if (!date) return { date: null, error: 'Taka data nie istnieje. Sprawdź dzień i miesiąc.' };

  if (date > today) return { date: null, error: 'Data urodzenia nie może być z przyszłości.' };
  if (acceptanceDate && date > acceptanceDate) {
    return { date: null, error: 'Dziecko musiało urodzić się przed datą przyjęcia albo w tym samym dniu.' };
  }
  return { date, error: null };
}
