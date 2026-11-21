import type { AdoptionKind } from '@/domain/calculator/adoptionLeaveWeeks';
import type { BenefitVariant, FatherPlan, WorkOnLeave } from '@/domain/calculator/BenefitSimulation';
import type { PersonTitles } from '@/domain/calculator/PersonTitles';
import type { Z3Month } from '@/domain/calculator/resolveZ3Base';

/** Co liczymy: L4 w ciąży, zasiłek macierzyński po porodzie albo po przyjęciu dziecka. */
export type CalculatorSituation = 'pregnancy' | 'birth' | 'adoption';

/** Jedna osoba w formularzu: wszystkie tytuły (włączone lub nie) i ewentualnie Z-3. */
export type PersonForm = {
  titles: Required<PersonTitles>;
  /** Podstawa etatu liczona z 12 miesięcy Z-3 zamiast wpisanej ręcznie. */
  useZ3: boolean;
  months: Z3Month[];
};

export type CalculatorForm = {
  situation: CalculatorSituation;
  /** Data porodu / przyjęcia w formacie `DD.MM.RRRR` (tekst z pola). */
  dateText: string;
  /** 1–5 (5 = „5+”). */
  childrenCount: number;
  zaZyciem: boolean;
  preterm: { on: boolean; gestationWeek: number; birthWeightGrams: number; hospitalDays: number };
  adoption: { kind: AdoptionKind; childAgeYears: number; deferredSchool: boolean };
  variant: BenefitVariant;
  mother: PersonForm;
  father: PersonForm;
  fatherPlan: FatherPlan;
  work: WorkOnLeave;
  pregnancy: { days: number; usedDays: number; age50: boolean; insuredDays: number };
};

export type FormParent = 'mother' | 'father';
