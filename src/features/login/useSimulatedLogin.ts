import { useCallback, useEffect, useRef, useState } from 'react';

import { useSession } from '@/session';

/** Udawany czas odpowiedzi węzła krajowego (login.gov.pl / mObywatel). */
const SIMULATED_DELAY_MS = 1200;

/** Zaślepka logowania przez mObywatel: chwila „ładowania”, potem zalogowanie. */
export function useSimulatedLogin() {
  const { signIn } = useSession();
  const [isLoading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const login = useCallback(() => {
    setLoading(true);
    timer.current = setTimeout(() => {
      setLoading(false);
      signIn();
    }, SIMULATED_DELAY_MS);
  }, [signIn]);

  return { isLoading, login };
}
