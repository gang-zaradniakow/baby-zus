/** Czysta funkcja: losowa ciekawostka; `random` podawany z zewnątrz, żeby dało się ją testować. */
export function pickFact(facts: readonly string[], random: number = Math.random()): string {
  const index = Math.min(Math.floor(random * facts.length), facts.length - 1);
  return facts[index] ?? '';
}
