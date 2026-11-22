import { createContext } from 'react';

import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

export type ParamsChange = { at: Date; description: string };

/** Skąd są parametry domyślne: z serwera (wersja i data obowiązywania) albo lokalne (brak połączenia). */
export type ParamsSource =
  | { kind: 'loading' }
  | { kind: 'server'; version: number; validFrom: string; description: string }
  | { kind: 'local' };

export type LegalParamsValue = {
  /** Parametry, z których liczą kalkulatory: domyślne + ewentualne zmiany z Panelu administracyjnego. */
  params: LegalParams;
  /** Parametry domyślne: z serwera (`GET /api/v1/legal-parameters`) albo lokalne. */
  defaults: LegalParams;
  source: ParamsSource;
  /** Czy ktoś zmienił parametry w Panelu administracyjnym. */
  isChanged: boolean;
  /** Rejestr zmian — najnowsze pierwsze (w produkcji: z datą obowiązywania i autorem). */
  changeLog: readonly ParamsChange[];
  save: (params: LegalParams, description: string) => void;
  /** Wraca do parametrów domyślnych. */
  reset: () => void;
};

export const LegalParamsContext = createContext<LegalParamsValue>({
  params: LEGAL_PARAMS,
  defaults: LEGAL_PARAMS,
  source: { kind: 'local' },
  isChanged: false,
  changeLog: [],
  save: () => {},
  reset: () => {},
});
