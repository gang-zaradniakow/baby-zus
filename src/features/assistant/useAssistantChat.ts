import { useState } from 'react';

import { KNOWLEDGE_BASE } from '@/data/assistant/knowledgeBase';
import { SUGGESTIONS } from '@/data/assistant/suggestions';
import { answerQuestion, type AssistantAnswer } from '@/domain/assistant/answerQuestion';
import { personalizeAnswer } from '@/domain/assistant/personalizeAnswer';
import { useZusData } from '@/features/zus/useZusData';
import { useLegalParams } from '@/params';
import { useSession } from '@/session';

export type Feedback = 'helpful' | 'notHelpful';

export type ChatMessage =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; answer: AssistantAnswer; personal: string | null; feedback: Feedback | null };

/** Ile ostatnich wiadomości trzymamy (jak w prototypie). */
const MAX_MESSAGES = 40;

/**
 * Rozmowa z Asystentem: pytania i odpowiedzi z lokalnej bazy wiedzy (bez AI, działa offline),
 * „Dla Ciebie” z profilu, ocena odpowiedzi. Podpowiedzi zależą od etapu i trybu wsparcia.
 */
export function useAssistantChat() {
  const { profile, isSignedIn, supportMode } = useSession();
  const zus = useZusData();
  const { params } = useLegalParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextId, setNextId] = useState(1);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question) return;
    const answer = answerQuestion(KNOWLEDGE_BASE, question);
    const debt = isSignedIn ? (zus?.account.debt ?? 0) : 0;
    const personal = answer.kind === 'entry' ? personalizeAnswer(answer.entry.id, profile, debt, params) : null;
    setMessages((list) =>
      [
        ...list,
        { id: nextId, role: 'user' as const, text: question },
        { id: nextId + 1, role: 'assistant' as const, answer, personal, feedback: null },
      ].slice(-MAX_MESSAGES),
    );
    setNextId((id) => id + 2);
  };

  const rate = (messageId: number, feedback: Feedback) =>
    setMessages((list) => list.map((m) => (m.id === messageId && m.role === 'assistant' ? { ...m, feedback } : m)));

  const suggestions =
    supportMode !== 'none' ? SUGGESTIONS.support : profile ? SUGGESTIONS[profile.stage] : SUGGESTIONS.general;

  return { messages, ask, rate, suggestions, greetingName: profile?.name ?? null };
}
