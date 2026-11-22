import { fetchJson } from '../fetchJson';

import type { LegalParametersResponse } from './LegalParametersResponse';

/** Parametry prawne obowiązujące dziś. */
export function fetchLegalParameters(): Promise<LegalParametersResponse> {
  return fetchJson<LegalParametersResponse>('/api/v1/legal-parameters');
}
