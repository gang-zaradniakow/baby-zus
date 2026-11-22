import { useMemo, useState, type ReactNode } from 'react';

import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

import { LegalParamsContext, type LegalParamsValue, type ParamsChange } from './LegalParamsContext';
import { useBackendLegalParams } from './useBackendLegalParams';

type Props = { children: ReactNode };

/**
 * Parametry prawne: domyślne z backendu (`GET /api/v1/legal-parameters`), a dopóki nie przyjdą albo gdy
 * backend jest niedostępny — lokalne z `data/legalParams`. Zmiany z Panelu administracyjnego trzymamy
 * w pamięci jako nadpisanie (backend nie ma jeszcze zapisu) i obowiązują od razu we wszystkich kalkulatorach.
 */
export function LegalParamsProvider({ children }: Props) {
  const defaults = useBackendLegalParams() ?? LEGAL_PARAMS;
  const [override, setOverride] = useState<LegalParams | null>(null);
  const [changeLog, setChangeLog] = useState<readonly ParamsChange[]>([]);

  const value = useMemo<LegalParamsValue>(
    () => ({
      params: override ?? defaults,
      isChanged: override !== null,
      changeLog,
      save: (next, description) => {
        setOverride(next);
        setChangeLog((log) => [{ at: new Date(), description }, ...log]);
      },
      reset: () => {
        setOverride(null);
        setChangeLog((log) => [{ at: new Date(), description: 'Przywrócono parametry domyślne' }, ...log]);
      },
    }),
    [defaults, override, changeLog],
  );

  return <LegalParamsContext value={value}>{children}</LegalParamsContext>;
}
