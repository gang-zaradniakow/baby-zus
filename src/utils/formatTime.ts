/** Godzina „14:05” bez Intl (Hermes na Androidzie nie zawsze ma polskie dane lokalizacji). */
export function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
