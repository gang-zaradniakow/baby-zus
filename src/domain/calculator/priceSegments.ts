import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

import type { BenefitSegment, Parent, PricedSegment } from './BenefitSimulation';
import { toNetAmount } from './toNetAmount';

export type PricedSegments = {
  segments: PricedSegment[];
  /** Czy gdzieś zadziałało minimum 1000 zł na rękę (art. 31 ust. 3a). */
  minimumApplied: boolean;
};

/**
 * Kwoty dla odcinków urlopu: podstawa × stopa × mnożnik pracy, na rękę po PIT; przy pełnym
 * zasiłku (bez pracy) nie mniej niż świadczenie rodzicielskie (1000 zł). Miesiąc = 30 dni.
 */
export function priceSegments(
  segments: readonly BenefitSegment[],
  bases: Record<Parent, number>,
  params: LegalParams = LEGAL_PARAMS,
): PricedSegments {
  let minimumApplied = false;
  const priced = segments.map((segment) => {
    const monthlyGross = bases[segment.who] * segment.rate * segment.factor;
    let monthlyNet = toNetAmount(monthlyGross, params);
    if (segment.factor === 1 && monthlyGross > 0 && monthlyNet < params.parentalBenefitMonthly) {
      monthlyNet = params.parentalBenefitMonthly;
      minimumApplied = true;
    }
    return { ...segment, monthlyGross, monthlyNet, total: (monthlyNet * segment.weeks * 7) / 30 };
  });
  return { segments: priced, minimumApplied };
}
