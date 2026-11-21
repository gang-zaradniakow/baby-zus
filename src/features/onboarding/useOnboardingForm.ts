import { useState } from 'react';

import { toISODate } from '@/domain/dates/calendarDate';
import type {
  EmploymentId,
  ParentProfile,
  ParentStage,
  SpecialSituationId,
} from '@/domain/profile/ParentProfile';
import { toggleEmployment } from '@/domain/profile/toggleEmployment';
import { validateEventDate } from '@/domain/profile/validateEventDate';
import { useToday } from '@/hooks/useToday';
import { toggleInList } from '@/utils/toggleInList';

/** Kolejność kroków: 1 etap → 2 data → 3 zatrudnienie → 4 sytuacje szczególne. */
export const ONBOARDING_STEPS = 4;

export type OnboardingStep = 1 | 2 | 3 | 4;

type Draft = {
  stage: ParentStage | null;
  /** Tekst z pola daty — może być niepełny w trakcie wpisywania. */
  eventDateText: string;
  employment: EmploymentId[];
  special: SpecialSituationId[];
};

const EMPTY_DRAFT: Draft = { stage: null, eventDateText: '', employment: [], special: [] };

/** Stan kreatora onboardingu: bieżący krok, odpowiedzi i walidacja. Bez widoku. */
export function useOnboardingForm(onComplete: (profile: ParentProfile) => void) {
  const today = useToday();
  const [step, setStep] = useState<OnboardingStep>(1);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const eventDate = validateEventDate(draft.stage, draft.eventDateText, today);

  const selectStage = (stage: ParentStage) => {
    setDraft((d) => ({ ...d, stage }));
    setStep(2);
  };

  const setEventDateText = (eventDateText: string) => setDraft((d) => ({ ...d, eventDateText }));

  const toggleEmploymentOption = (id: EmploymentId) =>
    setDraft((d) => ({ ...d, employment: toggleEmployment(d.employment, id) }));

  const toggleSpecialSituation = (id: SpecialSituationId) =>
    setDraft((d) => ({ ...d, special: toggleInList(d.special, id) }));

  const goBack = () => setStep((s) => (s > 1 ? ((s - 1) as OnboardingStep) : s));
  const goNext = () => setStep((s) => (s < ONBOARDING_STEPS ? ((s + 1) as OnboardingStep) : s));

  const canContinueByStep: Record<OnboardingStep, boolean> = {
    1: draft.stage !== null,
    2: eventDate.date !== null,
    3: draft.employment.length > 0,
    4: true,
  };

  const finish = () => {
    if (!draft.stage || !eventDate.date) return;
    onComplete({
      stage: draft.stage,
      eventDate: toISODate(eventDate.date),
      employment: draft.employment,
      special: draft.special,
    });
  };

  return {
    step,
    draft,
    eventDateError: eventDate.error,
    canContinue: canContinueByStep[step],
    selectStage,
    setEventDateText,
    toggleEmploymentOption,
    toggleSpecialSituation,
    goBack,
    goNext,
    finish,
  };
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>;
