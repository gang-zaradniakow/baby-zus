/** Zwraca nowy zbiór: usuwa `item`, jeśli był, albo go dodaje. Nie modyfikuje wejścia. */
export function toggleInSet<T>(set: ReadonlySet<T>, item: T): ReadonlySet<T> {
  const next = new Set(set);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
}
