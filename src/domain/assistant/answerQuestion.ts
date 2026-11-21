import type { KnowledgeEntry } from './KnowledgeEntry';
import { searchKnowledgeBase } from './searchKnowledgeBase';

/** Poniżej tej punktacji nie mamy pewnej odpowiedzi — wolimy nie zgadywać. */
export const CONFIDENT_SCORE = 2;

export type AssistantAnswer =
  | { kind: 'entry'; entry: KnowledgeEntry; related: KnowledgeEntry[] }
  /** Brak pewnej odpowiedzi — kontakt z ZUS i ewentualnie najbliższe pytania. */
  | { kind: 'fallback'; related: KnowledgeEntry[] };

/**
 * Odpowiedź Asystenta (port `answerLocal`): najlepiej dopasowany wpis i do 3 podobnych pytań;
 * gdy dopasowanie jest słabe — uczciwe „nie wiem” zamiast zgadywania w sprawach pieniędzy.
 */
export function answerQuestion(entries: readonly KnowledgeEntry[], query: string): AssistantAnswer {
  const results = searchKnowledgeBase(entries, query);
  if (results.length === 0 || results[0].score < CONFIDENT_SCORE) {
    return { kind: 'fallback', related: results.slice(0, 3).map((r) => r.entry) };
  }
  return {
    kind: 'entry',
    entry: results[0].entry,
    related: results
      .slice(1, 4)
      .filter((r) => r.score >= CONFIDENT_SCORE)
      .map((r) => r.entry),
  };
}
