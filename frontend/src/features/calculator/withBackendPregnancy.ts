import type { BackendSickPay } from '@/api/calculations';
import type { LegalParams } from '@/data/legalParams';

import { buildPregnancyCalculation, type PregnancyCalculation } from './computeCalculation';

/** Wynik L4 w ciąży z kwotami i wyjaśnieniami policzonymi przez backend (osoba i formularz — lokalne). */
export function withBackendPregnancy(
  local: PregnancyCalculation,
  backend: BackendSickPay,
  childrenCount: number,
  params: LegalParams,
): PregnancyCalculation {
  const sickPay = { checks: backend.checks, parts: backend.parts, total: backend.total };
  return buildPregnancyCalculation(sickPay, backend.netTotal, local.mother, childrenCount, params);
}
