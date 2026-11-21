/**
 * Termin urzędowy.
 * - `after`  — „w ciągu X dni od zdarzenia” (KPA art. 57 § 4 / KC art. 115):
 *              koniec w sobotę/święto przesuwa się na następny dzień roboczy.
 * - `before` — „nie później niż X dni przed” (Kodeks pracy): liczony wstecz, NIE przesuwa się do przodu.
 */
export type Deadline = {
  kind: 'after' | 'before';
  /** Data wynikająca z samego liczenia dni. */
  raw: Date;
  /** Data obowiązująca prawnie (po ewentualnym przesunięciu). */
  legal: Date;
  /** Data zalecana — dzień roboczy z zapasem. */
  safe: Date;
  shifted: boolean;
  /** Dlaczego termin przesunięto / dlaczego warto złożyć wcześniej (np. „sobota”). */
  reason: string | null;
};
