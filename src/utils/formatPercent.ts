/** Stopa jako procent po polsku: 0.815 → „81,5%”, 1 → „100%”. */
export function formatPercent(rate: number): string {
  const value = Math.round(rate * 1000) / 10;
  return `${String(value).replace('.', ',')}%`;
}
