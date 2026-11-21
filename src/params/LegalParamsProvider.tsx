import { useMemo, useState, type ReactNode } from 'react';

import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

import { LegalParamsContext, type LegalParamsValue, type ParamsChange } from './LegalParamsContext';

type Props = { children: ReactNode };

/**
 * Parametry prawne w pamięci (mock Panelu administracyjnego — bez REST; w prototypie był
 * `PUT /api/params` + localStorage). Zmiana obowiązuje od razu we wszystkich kalkulatorach.
 */
export function LegalParamsProvider({ children }: Props) {
  const [params, setParams] = useState<LegalParams>(LEGAL_PARAMS);
  const [changeLog, setChangeLog] = useState<readonly ParamsChange[]>([]);

  const value = useMemo<LegalParamsValue>(
    () => ({
      params,
      isChanged: params !== LEGAL_PARAMS,
      changeLog,
      save: (next, description) => {
        setParams(next);
        setChangeLog((log) => [{ at: new Date(), description }, ...log]);
      },
      reset: () => {
        setParams(LEGAL_PARAMS);
        setChangeLog((log) => [{ at: new Date(), description: 'Przywrócono parametry domyślne' }, ...log]);
      },
    }),
    [params, changeLog],
  );

  return <LegalParamsContext value={value}>{children}</LegalParamsContext>;
}
