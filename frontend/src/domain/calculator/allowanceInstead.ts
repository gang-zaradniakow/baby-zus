import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

import type { PersonResolution } from './resolvePerson';

export type AllowanceInstead = {
  kind: 'krus' | 'municipal';
  title: string;
  /** Kto wypłaca i gdzie złożyć wniosek. */
  payer: string;
  monthly: number;
  weeks: number;
};

/**
 * Gdy zasiłku z ZUS nie ma: zasiłek z KRUS (rolnik) albo świadczenie rodzicielskie z gminy —
 * oba 1000 zł/mies. przez 52 tyg. (1 dziecko), dłużej przy więcej dzieciach. `null` — zasiłek z ZUS jest.
 */
export function allowanceInstead(
  person: PersonResolution,
  childrenCount = 1,
  params: LegalParams = LEGAL_PARAMS,
): AllowanceInstead | null {
  if (person.title !== 'none') return null;
  const weeksTable = params.parentalBenefitWeeks;
  const weeks = weeksTable[Math.min(Math.max(childrenCount, 1), weeksTable.length) - 1];
  return person.krus
    ? { kind: 'krus', title: 'Zasiłek macierzyński z KRUS', payer: 'wypłaca KRUS (nie ZUS)', monthly: params.parentalBenefitMonthly, weeks }
    : {
        kind: 'municipal',
        title: 'Świadczenie rodzicielskie',
        payer: 'wniosek w gminie / MOPS (nie ZUS)',
        monthly: params.parentalBenefitMonthly,
        weeks,
      };
}
