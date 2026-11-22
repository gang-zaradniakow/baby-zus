import { postJson } from '../postJson';

import { fromPregnancySickness, type BackendSickPay } from './fromPregnancySickness';
import type { PregnancySicknessRequest, PregnancySicknessResponse } from './PregnancySickness';

/** L4 w ciąży (kod B) policzone przez backend. */
export async function fetchPregnancySickness(
  request: PregnancySicknessRequest,
  signal?: AbortSignal,
): Promise<BackendSickPay> {
  const response = await postJson<PregnancySicknessResponse>('/api/v1/calculations/sickness-in-pregnancy', request, signal);
  return fromPregnancySickness(response);
}
