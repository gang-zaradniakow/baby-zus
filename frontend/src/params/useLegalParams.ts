import { use } from 'react';

import { LegalParamsContext } from './LegalParamsContext';

/** Bieżące parametry prawne i operacje Panelu administracyjnego. */
export function useLegalParams() {
  return use(LegalParamsContext);
}
