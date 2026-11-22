import { useEffect, useRef, useState } from 'react';

import { useLegalParams } from '@/params';

import { advanceProgress, LOADING_TICK_MS } from './loadingProgress';
import { resolveLoadingStatus } from './resolveLoadingStatus';

/** Ile sekund „Dalej (n)” czeka, zanim samo przejdzie dalej. */
export const AUTO_CONTINUE_SECONDS = 4;

export type LoadingSequence = {
  progress: number;
  status: string;
  /** Sekundy do automatycznego przejścia; `null`, dopóki ładowanie trwa. */
  secondsLeft: number | null;
};

/**
 * Stan ekranu ładowania: pasek rośnie co takt (czekając na parametry prawne z serwera),
 * a po „Gotowe!” odlicza `AUTO_CONTINUE_SECONDS` i wywołuje `onFinish`.
 */
export function useLoadingSequence(onFinish: () => void): LoadingSequence {
  const { source } = useLegalParams();
  const ready = source.kind !== 'loading';
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const done = progress >= 1;

  const finishRef = useRef(onFinish);
  useEffect(() => {
    finishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setProgress((value) => advanceProgress(value, ready)), LOADING_TICK_MS);
    return () => clearInterval(id);
  }, [done, ready]);

  useEffect(() => {
    if (!done) return;
    if (elapsedSeconds >= AUTO_CONTINUE_SECONDS) {
      finishRef.current();
      return;
    }
    const id = setTimeout(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => clearTimeout(id);
  }, [done, elapsedSeconds]);

  return {
    progress,
    status: resolveLoadingStatus(progress),
    secondsLeft: done ? AUTO_CONTINUE_SECONDS - elapsedSeconds : null,
  };
}
