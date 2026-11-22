import { createContext } from 'react';

import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

export type ParamsChange = { at: Date; description: string };

export type LegalParamsValue = {
  /** Parametry, z których liczą kalkulatory (domyślne albo nadpisane w Panelu administracyjnym). */
  params: LegalParams;
  /** Czy ktoś zmienił parametry względem domyślnych. */
  isChanged: boolean;
  /** Rejestr zmian — najnowsze pierwsze (w produkcji: z datą obowiązywania i autorem). */
  changeLog: readonly ParamsChange[];
  save: (params: LegalParams, description: string) => void;
  /** Przywraca parametry domyślne (z backendu, a bez niego — z `data/legalParams`). */
  reset: () => void;
};

export const LegalParamsContext = createContext<LegalParamsValue>({
  params: LEGAL_PARAMS,
  isChanged: false,
  changeLog: [],
  save: () => {},
  reset: () => {},
});
