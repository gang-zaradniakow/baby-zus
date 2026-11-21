import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { resolvePerson, type PersonResolution } from '@/domain/calculator/resolvePerson';
import { resolveZ3Base, type Z3Base } from '@/domain/calculator/resolveZ3Base';

import type { PersonForm } from './CalculatorForm';

export type ResolvedPersonForm = {
  resolution: PersonResolution;
  /** Wynik z Z-3, gdy podstawa etatu jest liczona z miesięcy. */
  z3: Z3Base | null;
};

/** Osoba z formularza → rozstrzygnięcie zbiegu tytułów; przy Z-3 podstawa etatu ze średniej miesięcy. */
export function resolvePersonForm(person: PersonForm, params: LegalParams = LEGAL_PARAMS): ResolvedPersonForm {
  const { uop } = person.titles;
  if (!person.useZ3 || !uop.on) return { resolution: resolvePerson(person.titles, params), z3: null };

  const z3 = resolveZ3Base(person.months, 'uop', uop.atLeastMinWage, params);
  const titles = { ...person.titles, uop: { ...uop, base: Math.round(z3.base * 100) / 100 } };
  return { resolution: resolvePerson(titles, params), z3 };
}
