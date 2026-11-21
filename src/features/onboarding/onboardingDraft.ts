import type {
  ChildrenCount,
  EmploymentId,
  PayerSize,
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
  /** Tylko przy adopcji: data urodzenia dziecka, tekst z pola. */
  childBirthDateText: string;
  childrenCount: ChildrenCount | null;
  employment: EmploymentId[];
  payerSize: PayerSize | null;
  partner: PartnerMode | null;
  special: SpecialSituationId[];
  /** Opcjonalne — pusty tekst = nie podano. */
  name: string;
  childName: string;
};

export const EMPTY_DRAFT: OnboardingDraft = {
  role: null,
  stage: null,
  eventDateText: '',
  childBirthDateText: '',
  childrenCount: null,
  employment: [],
  payerSize: null,
  partner: null,
  special: [],
  name: '',
  childName: '',
};
