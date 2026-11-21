/**
 * Liczba wpisana po polsku: „4 147,10” → 4147.1. Spacje (także niełamliwe) i przecinek dziesiętny
 * są dozwolone; pusty lub niepoprawny tekst daje 0.
 */
export function parseDecimal(text: string): number {
  const normalized = text.replace(/[\s ]/g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}
