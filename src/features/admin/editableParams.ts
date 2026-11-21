import type { LegalParams } from '@/data/legalParams';

/** Pole parametru prawnego w Panelu administracyjnym: etykieta + odczyt i zapis w obiekcie parametrów. */
export type EditableParam = {
  id: string;
  label: string;
  get: (params: LegalParams) => number;
  set: (params: LegalParams, value: number) => LegalParams;
};

export type EditableParamGroup = { title: string; fields: readonly EditableParam[] };

type Rates = LegalParams['rates'];
type Sickness = LegalParams['sickness'];

const top = (id: keyof LegalParams & string, label: string): EditableParam => ({
  id,
  label,
  get: (p) => p[id] as number,
  set: (p, v) => ({ ...p, [id]: v }),
});
const rate = (id: keyof Rates, label: string): EditableParam => ({
  id: `rates.${id}`,
  label,
  get: (p) => p.rates[id],
  set: (p, v) => ({ ...p, rates: { ...p.rates, [id]: v } }),
});
const sickness = (id: keyof Sickness, label: string): EditableParam => ({
  id: `sickness.${id}`,
  label,
  get: (p) => p.sickness[id],
  set: (p, v) => ({ ...p, sickness: { ...p.sickness, [id]: v } }),
});
const parental = (id: keyof LegalParams['parentalWeeks'], label: string): EditableParam => ({
  id: `parentalWeeks.${id}`,
  label,
  get: (p) => p.parentalWeeks[id],
  set: (p, v) => ({ ...p, parentalWeeks: { ...p.parentalWeeks, [id]: v } }),
});
const maternity = (index: number): EditableParam => ({
  id: `maternityWeeks.${index}`,
  label: `Macierzyński — ${index + 1}${index === 4 ? '+' : ''} ${index === 0 ? 'dziecko' : 'dzieci'}`,
  get: (p) => p.maternityWeeks[index],
  set: (p, v) => ({ ...p, maternityWeeks: p.maternityWeeks.map((w, i) => (i === index ? v : w)) }),
});

/** Pola edytowalne — jak `PARAM_GROUPS` w prototypie. */
export const EDITABLE_PARAM_GROUPS: readonly EditableParamGroup[] = [
  {
    title: 'Kwoty (zł)',
    fields: [
      top('minWage', 'Płaca minimalna'),
      top('minBenefitBase', 'Minimalna podstawa zasiłku (pełny etat)'),
      top('maxVoluntaryBase', 'Maks. podstawa — dobrowolne chorobowe'),
      top('businessStandardBase', 'Standardowa podstawa składek JDG'),
      top('parentalBenefitMonthly', 'Minimum zasiłku macierzyńskiego na rękę'),
      top('debtLimit', 'Próg zaległości blokującej zasiłek'),
    ],
  },
  {
    title: 'Stopy procentowe (ułamek, np. 0,7 = 70%)',
    fields: [
      rate('maternity', 'Urlop macierzyński'),
      rate('parental', 'Urlop rodzicielski'),
      rate('averaged', 'Wariant uśredniony (wniosek do 21 dni)'),
      rate('supplementary', 'Uzupełniający urlop macierzyński'),
      rate('paternity', 'Urlop ojcowski'),
      rate('pregnancySickness', 'Zasiłek chorobowy w ciąży'),
      top('socialContributionRate', 'Składki pracownika (odliczane od podstawy)'),
      top('pitRate', 'Zaliczka PIT (symulacja)'),
    ],
  },
  {
    title: 'Wymiary (tygodnie / dni)',
    fields: [
      ...[0, 1, 2, 3, 4].map(maternity),
      parental('single', 'Rodzicielski — 1 dziecko'),
      parental('multiple', 'Rodzicielski — więcej dzieci'),
      parental('zaZyciemSingle', 'Rodzicielski „Za życiem” — 1 dziecko'),
      parental('zaZyciemMultiple', 'Rodzicielski „Za życiem” — więcej dzieci'),
      top('nonTransferableWeeks', 'Nieprzenoszalna część rodzicielskiego'),
      top('paternityWeeks', 'Urlop ojcowski'),
      top('motherOnlyMaternityWeeks', 'Macierzyński wyłącznie dla matki'),
      sickness('pregnancyPeriodDays', 'Okres zasiłkowy w ciąży (dni)'),
      sickness('employerPaidDays', 'Wynagrodzenie chorobowe (dni)'),
      sickness('waitingDaysMandatory', 'Wyczekiwanie — obowiązkowe (dni)'),
      sickness('waitingDaysVoluntary', 'Wyczekiwanie — dobrowolne (dni)'),
    ],
  },
];
