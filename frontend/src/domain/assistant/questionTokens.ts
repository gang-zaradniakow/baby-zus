/**
 * Tokenizacja pytań do Asystenta (port `norm`/`toks`/`stem` z prototypu, js/chat.js).
 * Inna niż wyszukiwarka Wiedzy: zachowuje `+ % @ -`, pomija słowa bez treści („czy”, „jak”…)
 * i porównuje rdzenie do 6 liter.
 */

/** Małe litery, bez ogonków (`ł` → `l`), `+` → „plus”, bez interpunkcji, pojedyncze spacje. */
export function normalizeQuestion(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/ł/g, 'l')
    .replace(/\+/g, ' plus ')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9%+@\- ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Słowa bez znaczenia dla dopasowania. */
export const STOP_WORDS: ReadonlySet<string> = new Set([
  'czy', 'jak', 'jaki', 'jaka', 'jakie', 'mam', 'moge', 'mnie', 'moj', 'moja', 'moje', 'sie', 'nie', 'tak', 'ile',
  'co', 'to', 'na', 'do', 'od', 'po', 'za', 'w', 'z', 'i', 'a', 'o', 'u', 'dla', 'jest', 'sa', 'ja', 'ty', 'oraz',
  'przy', 'przez', 'kiedy', 'gdzie', 'ktory', 'ktora', 'bede', 'jestem', 'chce', 'mi',
]);

/** Rdzeń słowa: pierwsze 6 liter; liczby bez zmian. */
export function stemToken(word: string): string {
  return /^\d/.test(word) ? word : word.slice(0, Math.min(word.length, 6));
}

/** Słowa pytania po normalizacji, bez słów pomijanych. */
export function questionTokens(text: string): string[] {
  return normalizeQuestion(text)
    .split(' ')
    .filter((word) => word && !STOP_WORDS.has(word));
}
