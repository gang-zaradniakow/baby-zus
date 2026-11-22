/** „dziś”, „jutro”, „za 5 dni”, „wczoraj”, „3 dni temu”. */
export function formatDaysLeft(days: number): string {
  if (days === 0) return 'dziś';
  if (days === 1) return 'jutro';
  if (days === -1) return 'wczoraj';
  if (days < 0) return `${-days} dni temu`;
  return `za ${days} dni`;
}
