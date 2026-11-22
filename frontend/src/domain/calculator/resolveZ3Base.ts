import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { formatMoney } from '@/utils/formatMoney';

import type { InsuranceTitleId } from './PersonTitles';

/** Jeden miesiąc z zaświadczenia płatnika (Z-3 / Z-3a). */
export type Z3Month = {
  /** Wynagrodzenie brutto (zł). */
  amount: number;
  /** Przepracowano mniej niż połowę czasu pracy — miesiąc pomijamy. */
  skip: boolean;
};

export type Z3Base = {
  /** Podstawa wymiaru zasiłku (po odjęciu składek, z minimum/limitem). */
  base: number;
  average: number;
  monthsUsed: number;
  note: string;
};

/**
 * Podstawa wymiaru zasiłku z 12 miesięcy zaświadczenia Z-3: średnia z miesięcy, których nie
 * pomijamy, minus 13,71% składek; na pełnym etacie nie mniej niż minimum, przy dobrowolnym
 * chorobowym nie więcej niż limit.
 */
export function resolveZ3Base(
  months: readonly Z3Month[],
  title: InsuranceTitleId = 'uop',
  fullTime = true,
  params: LegalParams = LEGAL_PARAMS,
): Z3Base {
  const used = months.filter((m) => !m.skip && m.amount > 0);
  if (used.length === 0) return { base: 0, average: 0, monthsUsed: 0, note: 'Wpisz co najmniej jeden miesiąc.' };

  const average = used.reduce((sum, m) => sum + m.amount, 0) / used.length;
  const rate = params.socialContributionRate;
  let base = average * (1 - rate);
  let note = `Średnia z ${used.length} mies. (${formatMoney(average)}) minus ${(rate * 100).toFixed(2).replace('.', ',')}% składek.`;

  if (title === 'uop' && fullTime && base < params.minBenefitBase) {
    base = params.minBenefitBase;
    note += ' Zastosowano minimalną podstawę dla pełnego etatu.';
  }
  if (title !== 'uop' && base > params.maxVoluntaryBase) {
    base = params.maxVoluntaryBase;
    note += ' Zastosowano limit podstawy dobrowolnego chorobowego.';
  }
  return { base, average, monthsUsed: used.length, note };
}
