/**
 * Upraszcza polski tekst do porównań w wyszukiwarce: małe litery, bez ogonków
 * (`ł` → `l`, `ż` → `z`…), bez znaczników `**` i interpunkcji, pojedyncze spacje.
 * Zostają cyfry, `%`, przecinek i łącznik — żeby kody druków („Z-3”, „Z-15A”) były jednym słowem.
 * Dzięki temu „zasilek” znajdzie „Zasiłek”.
 */
export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9%,-]+/g, ' ')
    .trim();
}
