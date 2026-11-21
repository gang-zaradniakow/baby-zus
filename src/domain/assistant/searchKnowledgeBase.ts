import type { KnowledgeEntry } from './KnowledgeEntry';
import { normalizeQuestion, questionTokens, STOP_WORDS, stemToken } from './questionTokens';

export type ScoredEntry = { entry: KnowledgeEntry; score: number };

/**
 * Dopasowanie pytania do bazy wiedzy (port `search` z prototypu). Punkty za: dokładne frazy „=…”,
 * frazy kilkuwyrazowe (całe albo słowo po słowie), pojedyncze słowa kluczowe (po rdzeniu), słowa
 * z treści pytania wzorcowego i liczby (bardzo wyróżniające, np. „270 dni”, „81,5”).
 * Wynik: wpisy z dodatnią punktacją, od najlepszego.
 */
export function searchKnowledgeBase(entries: readonly KnowledgeEntry[], query: string): ScoredEntry[] {
  const padded = ` ${normalizeQuestion(query)} `;
  const tokens = questionTokens(query);
  const stems = tokens.map(stemToken);
  const matchesStem = (word: string, minPrefix: number) => {
    const wordStem = stemToken(word);
    return stems.some((s) => s.startsWith(wordStem) || (wordStem.startsWith(s) && s.length >= minPrefix));
  };

  return entries
    .map((entry) => {
      const phrases = entry.keywords.filter((k) => !k.startsWith('=')).map(normalizeQuestion);
      const exact = entry.keywords.filter((k) => k.startsWith('=')).map((k) => normalizeQuestion(k.slice(1)));
      const questionStems = questionTokens(entry.question)
        .filter((w) => w.length > 3)
        .map(stemToken);

      let score = 0;
      for (const phrase of exact) {
        if (padded.includes(` ${phrase} `)) score += 2 + phrase.split(' ').length;
      }
      for (const phrase of phrases) {
        if (phrase.includes(' ')) {
          if (padded.includes(` ${phrase}`)) {
            score += 2 + phrase.split(' ').length;
          } else {
            const words = phrase.split(' ').filter((w) => !STOP_WORDS.has(w));
            const hits = words.filter((w) => matchesStem(w, 4)).length;
            if (words.length && hits === words.length) score += 2;
            else if (hits) score += 0.6 * hits;
          }
        } else if (phrase.length <= 3 ? tokens.includes(phrase) : matchesStem(phrase, 5)) {
          score += 2;
        }
      }
      for (const questionStem of questionStems) {
        if (stems.includes(questionStem)) score += 0.5;
      }
      const keywordNumbers = new Set(phrases.join(' ').split(' ').filter((w) => /^\d+$/.test(w)));
      for (const number of new Set(tokens.filter((w) => /^\d+$/.test(w)))) {
        if (keywordNumbers.has(number)) score += 3;
      }
      return { entry, score };
    })
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score);
}
