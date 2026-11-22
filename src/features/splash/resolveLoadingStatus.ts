/** Czysta funkcja: postęp ładowania (0–1) → napis pod wózkiem. */
export function resolveLoadingStatus(progress: number): string {
  if (progress >= 1) return 'Gotowe!';
  if (progress >= 0.5) return 'Łączę się…';
  return 'Ładuję wiedzę z poradnika…';
}
