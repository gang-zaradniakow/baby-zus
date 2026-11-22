/** Zwraca nową listę: usuwa `item`, jeśli był, albo go dodaje. Nie modyfikuje wejścia. */
export function toggleInList<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
