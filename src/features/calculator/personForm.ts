import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import type { InsuranceTitleId } from '@/domain/calculator/PersonTitles';
import type { Z3Month } from '@/domain/calculator/resolveZ3Base';
import type { EmploymentId } from '@/domain/profile/ParentProfile';

import type { PersonForm } from './CalculatorForm';

/** Tytuły, które da się włączyć chipem; `none` — „Nie pracuje” wyłącza wszystkie. */
export type TitleChipId = InsuranceTitleId | 'krus' | 'none';

const round2 = (value: number) => Math.round(value * 100) / 100;
const emptyMonths = (): Z3Month[] => Array.from({ length: 12 }, () => ({ amount: 0, skip: false }));

/**
 * Osoba z domyślnymi podstawami jak w prototypie (etat 6000 zł brutto, zlecenie 4500 zł,
 * firma — standardowa podstawa składek; każda minus 13,71%), z włączonymi tytułami z ankiety.
 */
export function createPersonForm(employment: readonly EmploymentId[] = [], params: LegalParams = LEGAL_PARAMS): PersonForm {
  const net = (gross: number) => round2(gross * (1 - params.socialContributionRate));
  const has = (id: EmploymentId) => employment.includes(id);
  return {
    titles: {
      uop: { on: has('uop'), base: Math.max(net(6000), params.minBenefitBase), atLeastMinWage: true },
      zlec: { on: has('zlec'), base: net(4500), voluntarySickness: true, student: false },
      jdg: { on: has('jdg'), base: net(params.businessStandardBase), voluntarySickness: true, startRelief: false, debt: 0 },
      krus: { on: false },
    },
    useZ3: false,
    months: emptyMonths(),
  };
}

/** Przełącza tytuł; „Nie pracuje” wyłącza wszystkie tytuły. */
export function toggleTitle(person: PersonForm, id: TitleChipId): PersonForm {
  const { titles } = person;
  if (id === 'none') {
    return {
      ...person,
      titles: {
        uop: { ...titles.uop, on: false },
        zlec: { ...titles.zlec, on: false },
        jdg: { ...titles.jdg, on: false },
        krus: { on: false },
      },
    };
  }
  return { ...person, titles: { ...titles, [id]: { ...titles[id], on: !titles[id].on } } };
}

/** Czy osoba nie ma żadnego włączonego tytułu („Nie pracuje”). */
export function hasNoTitles(person: PersonForm): boolean {
  const { uop, zlec, jdg, krus } = person.titles;
  return !uop.on && !zlec.on && !jdg.on && !krus.on;
}

/** Zmienia pola jednego tytułu (np. podstawę etatu). */
export function patchTitle<K extends InsuranceTitleId>(
  person: PersonForm,
  id: K,
  patch: Partial<PersonForm['titles'][K]>,
): PersonForm {
  return { ...person, titles: { ...person.titles, [id]: { ...person.titles[id], ...patch } } };
}

/** Zmienia jeden miesiąc z Z-3. */
export function patchZ3Month(person: PersonForm, index: number, patch: Partial<Z3Month>): PersonForm {
  return { ...person, months: person.months.map((m, i) => (i === index ? { ...m, ...patch } : m)) };
}
