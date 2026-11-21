export type TextSegment = { text: string; bold: boolean };

/**
 * Dzieli tekst ze znacznikami `**pogrubienie**` na kawałki zwykłe i pogrubione.
 * Niedomknięty `**` traktujemy jak zwykły tekst do końca.
 */
export function splitBoldSegments(text: string): TextSegment[] {
  const parts = text.split('**');
  const closed = parts.length % 2 === 1;
  const segments: TextSegment[] = parts.map((part, i) => ({
    text: part,
    bold: i % 2 === 1 && (closed || i < parts.length - 1),
  }));
  if (!closed) {
    const last = segments[segments.length - 1];
    last.text = `**${last.text}`;
  }
  return segments.filter((segment) => segment.text.length > 0);
}
