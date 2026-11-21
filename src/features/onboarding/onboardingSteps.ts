import { hasExternalPayer } from '@/domain/profile/hasExternalPayer';

import type { OnboardingDraft } from './onboardingDraft';

export type OnboardingStepId =
  | 'role'
  | 'stage'
  | 'date'
  | 'childBirthDate'
  | 'count' | 'special' | 'employment' | 'payer' | 'partner' | 'names';

type StepRule = {
  id: OnboardingStepId;
  /** Wybór jednej karty od razu przechodzi dalej — bez przycisku „Dalej”. */
  autoAdvance?: boolean;
  /** Brak = krok zawsze widoczny. Warunek może zależeć tylko od odpowiedzi z wcześniejszych kroków. */
  showIf?: (draft: OnboardingDraft) => boolean;
};

/** Kolejność kroków ankiety, jak w prototypie (ONB w app.js). */
const STEP_RULES: readonly StepRule[] = [
  { id: 'role', autoAdvance: true },
  { id: 'stage', autoAdvance: true },
  { id: 'date' },
  { id: 'childBirthDate', showIf: (draft) => draft.stage === 'adopcja' },
  { id: 'count', autoAdvance: true },
  { id: 'special' },
  { id: 'employment' },
  { id: 'payer', autoAdvance: true, showIf: (draft) => hasExternalPayer(draft.employment) },
  { id: 'partner', autoAdvance: true },
  { id: 'names' },
];

/** Kroki, które ten rodzic powinien zobaczyć przy obecnych odpowiedziach. */
export function getVisibleSteps(draft: OnboardingDraft): OnboardingStepId[] {
  return STEP_RULES.filter((rule) => !rule.showIf || rule.showIf(draft)).map((rule) => rule.id);
}

export function isAutoAdvanceStep(id: OnboardingStepId): boolean {
  return STEP_RULES.some((rule) => rule.id === id && rule.autoAdvance === true);
}
