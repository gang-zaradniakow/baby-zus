import type { PersonTitles } from '@/domain/calculator/PersonTitles';

import type { PregnancySicknessRequest } from './PregnancySickness';
import { toInsuranceTitlesRequest } from './toInsuranceTitlesRequest';

export type PregnancyLeave = { days: number; usedDays: number; age50: boolean; insuredDays: number };

const whole = (value: number, min: number, max: number) => Math.round(Math.max(min, Math.min(max, value || 0)));

/** Formularz L4 w ciąży → zapytanie backendu. Wartości przycinamy do zakresów z kontraktu. */
export function toPregnancySicknessRequest(titles: PersonTitles, leave: PregnancyLeave): PregnancySicknessRequest {
  return {
    titles: toInsuranceTitlesRequest(titles),
    days: whole(leave.days, 1, 2000),
    usedSickPayDays: whole(leave.usedDays, 0, 400),
    aged50OrMore: leave.age50,
    insuredDays: whole(leave.insuredDays, 0, 100_000),
  };
}
