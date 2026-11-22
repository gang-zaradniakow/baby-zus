import type { PersonTitles } from '@/domain/calculator/PersonTitles';

import type { InsuranceTitlesRequest } from './InsuranceTitlesRequest';
import { toMoney } from './toMoney';

/** Tytuły z kalkulatora (`uop`/`zlec`/`jdg`/`krus`) → zapytanie backendu; wyłączony tytuł pomijamy. */
export function toInsuranceTitlesRequest(titles: PersonTitles): InsuranceTitlesRequest {
  const { uop, zlec, jdg, krus } = titles;
  return {
    ...(uop?.on && { employment: { base: toMoney(uop.base), atLeastMinimumWage: uop.atLeastMinWage } }),
    ...(zlec?.on && {
      mandateContract: { base: toMoney(zlec.base), voluntarySickness: zlec.voluntarySickness, student: zlec.student },
    }),
    ...(jdg?.on && {
      selfEmployment: {
        base: toMoney(jdg.base),
        voluntarySickness: jdg.voluntarySickness,
        startupRelief: jdg.startRelief,
        debt: toMoney(jdg.debt),
      },
    }),
    agriculturalInsurance: !!krus?.on,
  };
}
