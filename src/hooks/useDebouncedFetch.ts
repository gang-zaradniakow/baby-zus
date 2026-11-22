import { useEffect, useState } from 'react';

import { useDebouncedValue } from './useDebouncedValue';

/** Ile czekamy po ostatniej zmianie formularza, zanim zapytamy backend. */
export const BACKEND_DEBOUNCE_MS = 600;

/**
 * Wysyła `request` do `fetcher`, gdy przez `delayMs` się nie zmienia. Zwraca odpowiedź tylko wtedy, gdy dotyczy
 * bieżącego `request` — w trakcie zmian, przy błędzie i dla `null` zwraca `null` (ekran pokazuje wtedy wynik
 * lokalny). `request` porównujemy po treści (JSON), więc może być nowym obiektem przy każdym renderze.
 */
export function useDebouncedFetch<Req, Res>(
  request: Req | null,
  fetcher: (request: Req, signal: AbortSignal) => Promise<Res>,
  delayMs = BACKEND_DEBOUNCE_MS,
): Res | null {
  const key = request === null ? null : JSON.stringify(request);
  const debouncedKey = useDebouncedValue(key, delayMs);
  const [answer, setAnswer] = useState<{ key: string; response: Res } | null>(null);

  useEffect(() => {
    if (debouncedKey === null) return;
    const controller = new AbortController();
    fetcher(JSON.parse(debouncedKey) as Req, controller.signal)
      .then((response) => setAnswer({ key: debouncedKey, response }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.warn('Wynik z backendu niedostępny, zostaje lokalny.', error);
      });
    return () => controller.abort();
  }, [debouncedKey, fetcher]);

  return answer !== null && answer.key === key ? answer.response : null;
}
