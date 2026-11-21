import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

/**
 * Wymiar urlopu rodzicielskiego (art. 182¹a KP): 41 tyg. przy jednym dziecku, 43 przy więcej;
 * z zaświadczeniem „Za życiem” 65 / 67 tyg.
 */
export function parentalLeaveWeeks(childrenCount = 1, zaZyciem = false, params: LegalParams = LEGAL_PARAMS): number {
  const weeks = params.parentalWeeks;
  const multiple = childrenCount > 1;
  if (zaZyciem) return multiple ? weeks.zaZyciemMultiple : weeks.zaZyciemSingle;
  return multiple ? weeks.multiple : weeks.single;
}
