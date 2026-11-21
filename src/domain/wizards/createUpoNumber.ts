/** Numer UPO (Urzędowe Poświadczenie Odbioru) — symulacja: data + kolejny numer, np. „UPO/2026/11/23/000003”. */
export function createUpoNumber(date: Date, sequence: number): string {
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  return `UPO/${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${pad(sequence, 6)}`;
}
