import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchLegalParameters } from '@/api/legalParametersApi';
import type { MappedLegalParameters } from '@/api/mapLegalParameters';
import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

import { LegalParamsContext, type LegalParamsValue, type ParamsChange, type ParamsSource } from './LegalParamsContext';

type Props = { children: ReactNode };

/**
 * Parametry prawne kalkulatorów. Przy starcie pobiera obowiązujący zestaw z backendu
 * (`GET /api/v1/legal-parameters`); bez połączenia zostają wartości lokalne z `data/legalParams`.
 * Zmiany z Panelu administracyjnego (mock) nakładają się na wartości domyślne, w pamięci.
 */
export function LegalParamsProvider({ children }: Props) {
  const [server, setServer] = useState<MappedLegalParameters | null>(null);
  const [failed, setFailed] = useState(false);
  const [override, setOverride] = useState<LegalParams | null>(null);
  const [changeLog, setChangeLog] = useState<readonly ParamsChange[]>([]);

  useEffect(() => {
    let active = true;
    fetchLegalParameters()
      .then((mapped) => active && setServer(mapped))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<LegalParamsValue>(() => {
    const defaults = server?.params ?? LEGAL_PARAMS;
    const source: ParamsSource = server
      ? { kind: 'server', version: server.version, validFrom: server.validFrom, description: server.description }
      : failed
        ? { kind: 'local' }
        : { kind: 'loading' };
    const log = (description: string) => setChangeLog((entries) => [{ at: new Date(), description }, ...entries]);

    return {
      params: override ?? defaults,
      defaults,
      source,
      isChanged: override !== null,
      changeLog,
      save: (next, description) => {
        setOverride(next);
        log(description);
      },
      reset: () => {
        setOverride(null);
        log('Przywrócono parametry domyślne');
      },
    };
  }, [server, failed, override, changeLog]);

  return <LegalParamsContext value={value}>{children}</LegalParamsContext>;
}
