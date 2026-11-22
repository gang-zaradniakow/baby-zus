import { useEffect, useState } from 'react';

import { fetchLegalParameters, toLegalParams } from '@/api/legalParameters';
import type { LegalParams } from '@/data/legalParams';

/**
 * Pobiera raz parametry prawne z backendu (`GET /api/v1/legal-parameters`).
 * `null` — jeszcze nie przyszły albo backend jest niedostępny (wtedy liczymy z wartości lokalnych).
 */
export function useBackendLegalParams(): LegalParams | null {
  const [params, setParams] = useState<LegalParams | null>(null);

  useEffect(() => {
    let active = true;
    fetchLegalParameters()
      .then(toLegalParams)
      .then((remote) => active && setParams(remote))
      .catch((error: unknown) => console.warn('Parametry prawne z backendu niedostępne, używam lokalnych.', error));
    return () => {
      active = false;
    };
  }, []);

  return params;
}
