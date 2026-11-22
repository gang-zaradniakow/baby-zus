import { formatDate } from '@/domain/dates/formatDate';

import type { TimelineItem } from './TimelineItem';

/**
 * Opis terminu po ludzku, np.:
 * „termin: 12.01.2027 (wtorek) (przesunięty z 10.01.2027 — niedziela)”
 * „złóż najpóźniej 03.05.2027 (poniedziałek) — to święto, więc złóż do 30.04.2027 (piątek)”.
 */
export function formatDeadline(item: TimelineItem): string {
  const { deadline } = item;

  if (!deadline) return `${item.estimate ? 'ok. ' : ''}${formatDate(item.date)}`;

  if (deadline.kind === 'before') {
    let text = `złóż najpóźniej ${formatDate(deadline.raw, true)}`;
    if (deadline.reason) text += ` — to ${deadline.reason}, więc złóż do ${formatDate(deadline.safe, true)}`;
    return `${item.estimate ? 'ok. ' : ''}${text}`;
  }

  let text = `termin: ${formatDate(deadline.legal, true)}`;
  if (deadline.shifted) text += ` (przesunięty z ${formatDate(deadline.raw)} — ${deadline.reason})`;
  return `${item.estimate ? 'szacunkowo — ' : ''}${text}`;
}
