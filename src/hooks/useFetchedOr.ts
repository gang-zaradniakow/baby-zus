import { useEffect, useState } from 'react';

/**
 * Pobiera dane raz po zamontowaniu. Dopóki nie przyjdą albo gdy pobranie się nie uda, zwraca `fallback`
 * (dane lokalne), więc ekran zawsze ma co pokazać. `fetcher` i `fallback` powinny być stałe (poza komponentem).
 */
export function useFetchedOr<T>(fetcher: () => Promise<T>, fallback: T): T {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((fetched) => active && setData(() => fetched))
      .catch((error: unknown) => console.warn('Dane z backendu niedostępne, używam lokalnych.', error));
    return () => {
      active = false;
    };
  }, [fetcher]);

  return data ?? fallback;
}
