import type { CalcCheck } from '@/domain/calculator/CalcCheck';

import type { CheckDto } from './InsuranceTitlesRequest';

const LEVELS = { OK: 'ok', INFO: 'info', NO: 'no' } as const;

/** Wyjaśnienie z backendu → `CalcCheck` kalkulatora. */
export function toCalcCheck(check: CheckDto): CalcCheck {
  return { level: LEVELS[check.level], text: check.message };
}
