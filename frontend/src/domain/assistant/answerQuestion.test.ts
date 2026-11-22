import { KNOWLEDGE_BASE } from '@/data/assistant/knowledgeBase';

import prototypeAnswers from './__fixtures__/prototypeAnswers.json';
import { answerQuestion } from './answerQuestion';
import type { KnowledgeEntry } from './KnowledgeEntry';

/**
 * Port musi odpowiadać dokładnie tak jak prototyp: `prototypeAnswers.json` to wyniki oryginalnego
 * `answerLocal` z js/chat.js dla 51 pytań wzorcowych i 12 pytań swobodnych.
 */
describe('answerQuestion — zgodność z prototypem', () => {
  it.each(prototypeAnswers)('„$q”', ({ q, kind, id, related }) => {
    const answer = answerQuestion(KNOWLEDGE_BASE, q);

    expect(answer.kind).toBe(kind === 'kb' ? 'entry' : 'fallback');
    if (answer.kind === 'entry') expect(answer.entry.id).toBe(id);
    expect(answer.related.map((e) => e.id)).toEqual(related);
  });
});

describe('answerQuestion', () => {
  const entry = (id: string, keywords: string[], question = ''): KnowledgeEntry => ({
    id,
    question,
    keywords,
    answer: [],
    source: '',
    actions: [],
  });

  it('fraza „=…” liczy się tylko jako całe słowa', () => {
    const entries = [entry('ojc', ['=ojcowski'])];
    expect(answerQuestion(entries, 'urlop ojcowski').kind).toBe('entry');
    expect(answerQuestion(entries, 'ojcowskiego').kind).toBe('fallback');
  });

  it('liczby w pytaniu są mocno wyróżniające', () => {
    const entries = [entry('a', ['okres zasilkowy 270 dni']), entry('b', ['okres zasilkowy 182 dni'])];
    const answer = answerQuestion(entries, '270');
    expect(answer.kind === 'entry' && answer.entry.id).toBe('a');
  });

  it('słabe dopasowanie — uczciwe „nie wiem”', () => {
    expect(answerQuestion([entry('a', ['zasilek pogrzebowy'])], 'pogoda jutro').kind).toBe('fallback');
  });
});
