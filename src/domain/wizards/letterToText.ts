import { formatDate } from '@/domain/dates/formatDate';

import type { Letter } from './Wizard';

/** Pismo jako zwykły tekst — do udostępnienia (mail do kadr, komunikator) albo skopiowania. */
export function letterToText(letter: Letter, applicantName: string, date: Date, place = 'Warszawa'): string {
  const attachments = letter.attachments.length
    ? ['', 'Załączniki:', ...letter.attachments.map((a, i) => `${i + 1}. ${a}`)]
    : [];
  return [
    `${place}, ${formatDate(date)}`,
    '',
    applicantName,
    '',
    letter.to,
    '',
    ...letter.heading,
    '',
    ...letter.paragraphs.flatMap((p) => [p, '']),
    ...attachments,
    '',
    '..........................................',
    'podpis',
  ].join('\n');
}
