import { useState } from 'react';

import { toISODate } from '@/domain/dates/calendarDate';
import type {
  ChildrenCount,
  EmploymentId,
  ParentProfile,
  ParentRole,
  ParentStage,
  PartnerMode,
  PayerSize,
  SpecialSituationId,
} from '@/domain/profile/ParentProfile';
import { hasExternalPayer } from '@/domain/profile/hasExternalPayer';
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
  const selectPayerSize = (payerSize: PayerSize) => pickAndAdvance({ payerSize });
  const selectPartner = (partner: PartnerMode) => pickAndAdvance({ partner });

  const setEventDateText = (eventDateText: string) => setDraft((d) => ({ ...d, eventDateText }));
  const setName = (name: string) => setDraft((d) => ({ ...d, name }));
  const setChildName = (childName: string) => setDraft((d) => ({ ...d, childName }));

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
    payer: draft.payerSize !== null,
    partner: draft.partner !== null,
    names: true,
  };

  const finish = () => {
    if (!draft.role || !draft.stage || !eventDate.date || !draft.childrenCount || !draft.partner) return;
    // Odpowiedź o płatniku liczy się tylko, gdy krok był widoczny (np. po zmianie etatu na firmę — nie).
    const payerSize = hasExternalPayer(draft.employment) ? (draft.payerSize ?? undefined) : undefined;
    const name = draft.name.trim();
    // W ciąży nie pytamy o imię dziecka — ignorujemy to, co zostało po zmianie etapu.
    const childName = draft.stage === 'ciaza' ? '' : draft.childName.trim();
    onComplete({
      role: draft.role,
      stage: draft.stage,
      eventDate: toISODate(eventDate.date),
      childrenCount: draft.childrenCount,
      employment: draft.employment,
      ...(payerSize && { payerSize }),
      partner: draft.partner,
      special: draft.special,
      ...(name && { name }),
      ...(childName && { childName }),
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
    selectPayerSize,
    selectPartner,
    setEventDateText,
    setName,
    setChildName,
    toggleEmploymentOption,
    toggleSpecialSituation,
    goBack,
    goNext,
    finish,
  };
}

export type OnboardingForm = ReturnType<typeof useOnboardingForm>;
