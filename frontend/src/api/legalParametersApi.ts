import type { LegalParametersResponse } from './apiTypes';
import { fetchJson } from './fetchJson';
import { mapLegalParameters, type MappedLegalParameters } from './mapLegalParameters';

/** `GET /api/v1/legal-parameters` — parametry prawne obowiązujące dziś, już w postaci dla kalkulatorów. */
export async function fetchLegalParameters(): Promise<MappedLegalParameters> {
  return mapLegalParameters(await fetchJson<LegalParametersResponse>('/api/v1/legal-parameters'));
}
