const PATTERN = /^(\d{2})\.(\d{2})\.(\d{4})$/;

/** `DD.MM.RRRR` → data albo `null`, jeśli taki dzień nie istnieje (np. 31.02). */
export function parsePolishDate(text: string): Date | null {
  const match = PATTERN.exec(text);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  const exists = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return exists ? date : null;
}
