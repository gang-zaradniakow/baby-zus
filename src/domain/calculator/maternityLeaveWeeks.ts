import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

/** Wymiar urlopu macierzyńskiego wg liczby dzieci z jednego porodu (art. 180 KP): 20/31/33/35/37 tyg. */
export function maternityLeaveWeeks(childrenCount = 1, params: LegalParams = LEGAL_PARAMS): number {
  const weeks = params.maternityWeeks;
  const index = Math.min(Math.max(childrenCount, 1), weeks.length) - 1;
  return weeks[index];
}
