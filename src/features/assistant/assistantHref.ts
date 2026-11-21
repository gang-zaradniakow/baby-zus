/** Adres Asystenta z pytaniem zadawanym od razu (np. „Zapytaj asystenta” w Wiedzy albo w piśmie). */
export function assistantHref(question: string): string {
  return `/asystent?pytanie=${encodeURIComponent(question)}`;
}
