const MAX_DIGITS = 8;

/** Zostawia same cyfry i wstawia kropki: „1203” → „12.03”, „12032027” → „12.03.2027”. */
export function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, MAX_DIGITS);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4);
  return [day, month, year].filter(Boolean).join('.');
}
