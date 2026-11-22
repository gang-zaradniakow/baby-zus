/**
 * Bardzo prosty „rdzeń” słowa do wyszukiwania po polsku: ucina końcówkę odmiany,
 * żeby „zasilek” znalazł „zasilku”, a „ciaza” — „ciazy”. Krótkie słowa (np. „kod”, „Z-3”)
 * zostają bez zmian. Słowo musi być już po `normalizeSearchText`.
 */
export function stemSearchWord(word: string): string {
  if (word.length >= 6) return word.slice(0, -2);
  if (word.length === 5) return word.slice(0, -1);
  return word;
}
