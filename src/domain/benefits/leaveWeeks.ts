/** Wymiar urlopu macierzyńskiego wg liczby dzieci z jednego porodu (art. 180 KP). */
const MATERNITY_WEEKS = [20, 31, 33, 35, 37] as const;

export function maternityLeaveWeeks(childrenCount = 1): number {
  const index = Math.min(Math.max(childrenCount, 1), MATERNITY_WEEKS.length) - 1;
  return MATERNITY_WEEKS[index];
}
