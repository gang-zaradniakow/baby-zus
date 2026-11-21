import { useState } from 'react';

import { toISODate } from '@/domain/dates/calendarDate';
import type {
  ChildrenCount,
  EmploymentId,
  ParentProfile,
  ParentRole,
  ParentStage,
  SpecialSituationId,
} from '@/domain/profile/ParentProfile';
import { toggleEmployment } from '@/domain/profile/toggleEmployment';
import { validateEventDate } from '@/domain/profile/validateEventDate';
import { useToday } from '@/hooks/useToday';
import { toggleInList } from '@/utils/toggleInList';

import { EMPTY_DRAFT, type OnboardingDraft } from './onboardingDraft';
import { getVisibleSteps, isAutoAdvanceStep, type OnboardingStepId } from './onboardingSteps';

/** Stan ankiety: bieżący krok, odpowiedzi i walidacja. Bez widoku. */
export function useOnboardingForm(onComplete: (profile: ParentProfile) => void) {
  const today = useToday();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);

  const steps = getVisibleSteps(draft);
  const lastIndex = steps.length - 1;
  const index = Math.min(stepIndex, lastIndex);
  const step = steps[index];

  const eventDate = validateEventDate(draft.stage, draft.eventDateText, today);

  const goBack = () => setStepIndex(Math.max(index - 1, 0));
  const goNext = () => setStepIndex(Math.min(index + 1, lastIndex));

  /** Zapisuje odpowiedź z kroku jednokrotnego wyboru i od razu przechodzi dalej. */
  const pickAndAdvance = (patch: Partial<OnboardingDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setStepIndex(index + 1);
  };

  const selectRole = (role: ParentRole) => pickAndAdvance({ role });
  const selectStage = (stage: ParentStage) => pickAndAdvance({ stage });
  const selectChildrenCount = (childrenCount: ChildrenCount) => pickAndAdvance({ childrenCount });

  const setEventDateText = (eventDateText: string) => setDraft((d) => ({ ...d, eventDateText }));

  const toggleEmploymentOption = (id: EmploymentId) =>
    setDraft((d) => ({ ...d, employment: toggleEmployment(d.employment, id) }));

  const toggleSpecialSituation = (id: SpecialSituationId) =>
    setDraft((d) => ({ ...d, special: toggleInList(d.special, id) }));

  const canContinueByStep: Record<OnboardingStepId, boolean> = {
    role: draft.role !== null,
    stage: draft.stage !== null,
    date: eventDate.date !== null,
    count: draft.childrenCount !== null,
    special: true,
    employment: draft.employment.length > 0,
  };

  const finish = () => {
    if (!draft.role || !draft.stage || !eventDate.date || !draft.childrenCount) return;
    onComplete({
      role: draft.role,
      stage: draft.stage,
      eventDate: toISODate(eventDate.date),
      childrenCount: draft.childrenCount,
      employment: draft.employment,
      partner: draft.partner,
      special: draft.special,
    });
  };

  return {
    step,
    /** Numer kroku od 1 — do paska postępu. */
    stepNumber: index + 1,
    totalSteps: steps.length,
    isFirstStep: index === 0,
    isLastStep: index === lastIndex,
    autoAdvances: isAutoAdvanceStep(step),
    draft,
    eventDateError: eventDate.error,
    canContinue: canContinueByStep[step],
    selectRole,
    selectStage,
    selectChildrenCount,
    setEventDateText,
    toggleEmploymentOption,
    toggleSpecialSituation,
    goBack,
    goNext,
    finish,
  };
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>;
