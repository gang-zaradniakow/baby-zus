import { fetchPregnancySickness, toPregnancySicknessRequest, type BackendSickPay } from '@/api/calculations';
import { useDebouncedFetch } from '@/hooks/useDebouncedFetch';

import type { CalculatorForm } from './CalculatorForm';
import type { Calculation } from './computeCalculation';

/**
 * L4 w ciąży policzone przez backend dla bieżącego formularza. `null` — inna sytuacja niż ciąża, parametry
 * zmienione w Panelu administracyjnym (backend ich nie zna), zapytanie w drodze albo backend niedostępny.
 */
export function useBackendPregnancy(
  form: CalculatorForm,
  local: Calculation,
  paramsChanged: boolean,
): BackendSickPay | null {
  const request =
    local.kind === 'pregnancy' && !paramsChanged ? toPregnancySicknessRequest(local.mother.titles, form.pregnancy) : null;
  return useDebouncedFetch(request, fetchPregnancySickness);
}
