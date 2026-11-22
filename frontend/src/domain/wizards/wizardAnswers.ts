import { parsePolishDate } from '@/domain/dates/parsePolishDate';

import type { StepIssue, WizardAnswers } from './Wizard';

/** Data z odpowiedzi (`DD.MM.RRRR`); `null` — brak albo niepoprawna. */
export function answerDate(answers: WizardAnswers, id: string): Date | null {
  return answers[id] ? parsePolishDate(answers[id]) : null;
}

/** Liczba z odpowiedzi; `null` — brak. */
export function answerNumber(answers: WizardAnswers, id: string): number | null {
  const value = answers[id];
  if (!value) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export const error = (text: string): StepIssue => ({ level: 'error', text });
export const warning = (text: string): StepIssue => ({ level: 'warning', text });
