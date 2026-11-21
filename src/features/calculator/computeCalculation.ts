import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { allowanceInstead, type AllowanceInstead } from '@/domain/calculator/allowanceInstead';
import type { BenefitSimulation } from '@/domain/calculator/BenefitSimulation';
import type { CalcCheck } from '@/domain/calculator/CalcCheck';
import { concurrentTitlesSickPay, type ConcurrentSickPay } from '@/domain/calculator/concurrentTitlesSickPay';
import { simulateBenefit } from '@/domain/calculator/simulateBenefit';
import { parsePolishDate } from '@/domain/dates/parsePolishDate';

import type { CalculatorForm } from './CalculatorForm';
import { resolvePersonForm, type ResolvedPersonForm } from './resolvePersonForm';

export type PregnancyCalculation = {
  kind: 'pregnancy';
  sickPay: ConcurrentSickPay;
  /** Wyjaśnienia do pokazania (bez zdublowanych „brak ubezpieczenia”). */
  checks: CalcCheck[];
  /** Gdy zasiłku z ZUS nie ma — co przysługuje po porodzie. */
  allowance: AllowanceInstead | null;
  mother: ResolvedPersonForm;
};

export type BenefitCalculation = {
  kind: 'benefit';
  simulation: BenefitSimulation;
  checks: CalcCheck[];
  allowance: AllowanceInstead | null;
  mother: ResolvedPersonForm;
  father: ResolvedPersonForm;
};

export type Calculation = PregnancyCalculation | BenefitCalculation;

const prefixed = (prefix: string, checks: readonly CalcCheck[]) => checks.map((c) => ({ ...c, text: prefix + c.text }));
/** Te komunikaty powtarza wynik (karta „nie przysługuje” / świadczenie zastępcze). */
const DUPLICATED_NO = /Rolnik w KRUS|Żaden z tytułów|Brak ubezpieczenia/;

/** Wynik kalkulatora dla bieżącego formularza — port `simOut` z prototypu (bez HTML). */
export function computeCalculation(form: CalculatorForm, today: Date, params: LegalParams = LEGAL_PARAMS): Calculation {
  const mother = resolvePersonForm(form.mother, params);

  if (form.situation === 'pregnancy') {
    const sickPay = concurrentTitlesSickPay(mother.resolution, form.pregnancy, params);
    const allowance = sickPay.parts.length === 0 ? allowanceInstead(mother.resolution, form.childrenCount, params) : null;
    const checks = sickPay.checks.filter((c) => c.level !== 'ok' && !(sickPay.parts.length === 0 && DUPLICATED_NO.test(c.text)));
    return { kind: 'pregnancy', sickPay, checks, allowance, mother };
  }

  const father = resolvePersonForm(form.father, params);
  const simulation = simulateBenefit(
    {
      situation: form.situation,
      startDate: parsePolishDate(form.dateText) ?? today,
      childrenCount: form.childrenCount,
      zaZyciem: form.zaZyciem,
      preterm: form.situation === 'birth' && form.preterm.on ? form.preterm : null,
      adoption: form.adoption,
      variant: form.variant,
      mother: mother.resolution,
      father: father.resolution,
      fatherPlan: form.fatherPlan,
      work: form.work,
    },
    params,
  );

  const allowance = allowanceInstead(mother.resolution, form.childrenCount, params);
  const fatherChecks = father.resolution.checks.filter((c) => c.level !== 'ok' || father.resolution.parts.length > 1);
  const personChecks = [...prefixed('Mama: ', mother.resolution.checks), ...prefixed('Tata: ', fatherChecks)].filter(
    (c) => !(c.level === 'no' && /Rolnik w KRUS|Żaden z tytułów/.test(c.text)),
  );
  const checks = [...personChecks, ...simulation.checks].filter(
    (c) => !(allowance && /^Mama: (brak ubezpieczenia|ubezpieczenie w KRUS)/.test(c.text)),
  );

  return { kind: 'benefit', simulation, checks, allowance, mother, father };
}
