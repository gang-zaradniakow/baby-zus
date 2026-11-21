import type { AdoptionKind } from './adoptionLeaveWeeks';
import type { CalcCheck } from './CalcCheck';
import type { PersonResolution } from './resolvePerson';
import type { PretermBirth } from './supplementaryLeaveWeeks';

export type Parent = 'mother' | 'father';

/** `averaged` — 81,5% przez cały okres (wniosek do 21 dni po porodzie); `standard` — 100% + 70%. */
export type BenefitVariant = 'averaged' | 'standard';

export type FatherPlan = {
  /** Urlop ojcowski (2 tyg., 100%). */
  paternity: boolean;
  /** Ile tygodni rodzicielskiego bierze tata (9 nieprzenoszalnych + ewentualnie więcej). */
  parentalWeeks: number;
  /** Ile tygodni macierzyńskiego przejmuje (po 14 tyg. mamy). */
  maternityTakeover: number;
};

export type WorkOnLeave = {
  who: 'none' | Parent;
  /** Część etatu: 0,25 albo 0,5. */
  fraction: number;
  /** Ile tygodni rodzicielskiego łączy z pracą. */
  weeks: number;
};

export type SimulationInput = {
  situation: 'birth' | 'adoption';
  /** Data porodu albo przyjęcia dziecka. */
  startDate: Date;
  childrenCount: number;
  zaZyciem: boolean;
  /** Tylko przy porodzie: wcześniak / dziecko w szpitalu. */
  preterm?: PretermBirth | null;
  adoption?: { kind: AdoptionKind; childAgeYears: number; deferredSchool?: boolean };
  variant: BenefitVariant;
  mother: PersonResolution;
  father: PersonResolution;
  fatherPlan: FatherPlan;
  work: WorkOnLeave;
};

/** Jeden odcinek urlopu na osi czasu (np. „Urlop rodzicielski, mama, 32 tyg., 70%”). */
export type BenefitSegment = {
  who: Parent;
  label: string;
  weeks: number;
  /** Stopa zasiłku (1 = 100%). */
  rate: number;
  /** Mnożnik przy pracy na urlopie (np. 0,5 przy pół etatu); 1 — bez pracy. */
  factor: number;
  from: Date;
  to: Date;
};

export type PricedSegment = BenefitSegment & {
  monthlyGross: number;
  monthlyNet: number;
  /** Razem na rękę za cały odcinek. */
  total: number;
};

export type BenefitSimulation = {
  maternityWeeks: number;
  parentalWeeks: number;
  supplementaryWeeks: number;
  segments: PricedSegment[];
  checks: CalcCheck[];
  notes: string[];
  totals: { mother: number; father: number; family: number };
  /** Czy faktycznie liczymy wariant 81,5%. */
  averaged: boolean;
};
