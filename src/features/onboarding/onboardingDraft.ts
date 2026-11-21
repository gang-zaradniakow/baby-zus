import type {
  ChildrenCount,
  EmploymentId,
  ParentRole,
  ParentStage,
  PartnerMode,
  SpecialSituationId,
} from '@/domain/profile/ParentProfile';

/** Odpowiedzi z ankiety w trakcie wypełniania — `null` = jeszcze bez odpowiedzi. */
export type OnboardingDraft = {
  role: ParentRole | null;
  stage: ParentStage | null;
  /** Tekst z pola daty — może być niepełny w trakcie wpisywania. */
  eventDateText: string;
  childrenCount: ChildrenCount | null;
  employment: EmploymentId[];
  // TODO(Faza 2): partner dostanie własny krok ankiety — do tego czasu domyślnie 'track'.
  partner: PartnerMode;
  special: SpecialSituationId[];
};

export const EMPTY_DRAFT: OnboardingDraft = {
  role: null,
  stage: null,
  eventDateText: '',
  childrenCount: null,
  employment: [],
  partner: 'track',
  special: [],
};
