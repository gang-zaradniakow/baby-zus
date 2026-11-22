/** Przyrost postępu na jeden takt (co `LOADING_TICK_MS`) — pełny pasek w ok. 2 s. */
export const LOADING_TICK_MS = 80;
const STEP = 0.04;

/** Do tego miejsca pasek dochodzi sam; resztę odblokowuje dopiero gotowość danych. */
export const WAITING_CAP = 0.9;

/**
 * Czysta funkcja: następna wartość paska. Bez gotowości danych (parametrów prawnych z serwera)
 * pasek zatrzymuje się na `WAITING_CAP`, żeby „Gotowe!” nie kłamało.
 */
export function advanceProgress(progress: number, ready: boolean): number {
  const limit = ready ? 1 : WAITING_CAP;
  return Math.min(progress + STEP, limit);
}
