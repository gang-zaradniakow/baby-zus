import type { LegalParametersResponse } from '../apiTypes';

/**
 * Odpowiedź `GET /api/v1/legal-parameters` dla wersji 1 (stan prawny 2026) — wartości z
 * baby-zus-backend: legalrules/infrastructure/catalog/LegalState2026.java.
 */
const amount = (key: string, label: string, value: number) => ({ key, kind: 'AMOUNT' as const, label, value });
const rate = (key: string, label: string, value: number) => ({ key, kind: 'RATE' as const, label, value });
const weeks = (key: string, label: string, value: number) => ({ key, kind: 'WEEKS' as const, label, value });
const days = (key: string, label: string, value: number) => ({ key, kind: 'DAYS' as const, label, value });
const years = (key: string, label: string, value: number) => ({ key, kind: 'YEARS' as const, label, value });

export const LEGAL_PARAMETERS_2026: LegalParametersResponse = {
  version: 1,
  validFrom: '2026-01-01',
  description:
    'Ustawa zasiłkowa (Dz.U. 2026 poz. 854), Kodeks pracy (Dz.U. 2026 poz. 1245), rozporządzenie z 27.09.2026 (Dz.U. 2026 poz. 1316), Poradnik ZUS dla rodziców i opiekunów dzieci 2026',
  parameters: [
    amount('MINIMUM_WAGE', 'Płaca minimalna', 4806),
    amount('MINIMUM_BENEFIT_BASE', 'Minimalna podstawa zasiłku (pełny etat)', 4147.1),
    amount('MAXIMUM_VOLUNTARY_BENEFIT_BASE', 'Maks. podstawa — dobrowolne chorobowe', 20321.3),
    amount('STANDARD_SELF_EMPLOYED_BASE', 'Standardowa podstawa składek JDG', 5652),
    amount('MINIMUM_MATERNITY_BENEFIT', 'Minimum zasiłku macierzyńskiego na rękę', 1000),
    amount('FUNERAL_GRANT', 'Zasiłek pogrzebowy', 7000),
    amount('DEBT_THRESHOLD', 'Próg zaległości blokującej zasiłek', 48.06),
    rate('EMPLOYEE_CONTRIBUTION_RATE', 'Składki pracownika (odliczane od podstawy)', 0.1371),
    rate('DEBT_THRESHOLD_RATE', 'Próg zaległości jako ułamek płacy minimalnej', 0.01),
    rate('MATERNITY_LEAVE_RATE', 'Urlop macierzyński', 1),
    rate('PARENTAL_LEAVE_RATE', 'Urlop rodzicielski', 0.7),
    rate('AVERAGED_RATE', 'Wariant uśredniony (wniosek do 21 dni)', 0.815),
    rate('SUPPLEMENTARY_LEAVE_RATE', 'Uzupełniający urlop macierzyński', 1),
    rate('PATERNITY_LEAVE_RATE', 'Urlop ojcowski', 1),
    rate('PREGNANCY_SICKNESS_RATE', 'Zasiłek chorobowy w ciąży', 1),
    rate('CARE_BENEFIT_RATE', 'Zasiłek opiekuńczy', 0.8),
    rate('PREGNANCY_REHABILITATION_RATE', 'Świadczenie rehabilitacyjne w ciąży', 1),
    rate('INCOME_TAX_ADVANCE_RATE', 'Zaliczka PIT (symulacja)', 0.12),
    { key: 'MATERNITY_LEAVE_WEEKS', kind: 'WEEKS_BY_CHILDREN', label: 'Urlop macierzyński wg liczby dzieci', values: [20, 31, 33, 35, 37] },
    {
      key: 'PARENTAL_ALLOWANCE_WEEKS',
      kind: 'WEEKS_BY_CHILDREN',
      label: 'Świadczenie rodzicielskie wg liczby dzieci',
      values: [52, 65, 67, 69, 71],
    },
    weeks('PARENTAL_LEAVE_WEEKS_ONE_CHILD', 'Rodzicielski — 1 dziecko', 41),
    weeks('PARENTAL_LEAVE_WEEKS_MULTIPLE_CHILDREN', 'Rodzicielski — więcej dzieci', 43),
    weeks('PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_ONE_CHILD', 'Rodzicielski „Za życiem” — 1 dziecko', 65),
    weeks('PARENTAL_LEAVE_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN', 'Rodzicielski „Za życiem” — więcej dzieci', 67),
    weeks('PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ONE_CHILD', 'Maks. rodzicielski z pracą — 1 dziecko', 82),
    weeks('PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_MULTIPLE_CHILDREN', 'Maks. rodzicielski z pracą — więcej dzieci', 86),
    weeks('PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_ONE_CHILD', 'Maks. rodzicielski z pracą „Za życiem” — 1 dziecko', 130),
    weeks(
      'PARENTAL_LEAVE_WITH_WORK_MAX_WEEKS_ZA_ZYCIEM_MULTIPLE_CHILDREN',
      'Maks. rodzicielski z pracą „Za życiem” — więcej dzieci',
      134,
    ),
    weeks('NON_TRANSFERABLE_PARENTAL_WEEKS', 'Nieprzenoszalna część rodzicielskiego', 9),
    weeks('PATERNITY_LEAVE_WEEKS', 'Urlop ojcowski', 2),
    weeks('MOTHER_ONLY_MATERNITY_WEEKS', 'Macierzyński wyłącznie dla matki', 14),
    weeks('MAX_MATERNITY_WEEKS_BEFORE_BIRTH', 'Maks. macierzyński przed porodem', 6),
    weeks('ADOPTION_MINIMUM_WEEKS', 'Min. urlop na warunkach macierzyńskiego', 9),
    weeks('ADOPTION_PARENTAL_MINIMUM_WEEKS', 'Rodzicielski przy minimalnym wymiarze adopcji', 38),
    weeks('ADOPTION_PARENTAL_MINIMUM_WEEKS_ZA_ZYCIEM', 'Rodzicielski przy minimalnym wymiarze adopcji „Za życiem”', 62),
    weeks('SUPPLEMENTARY_LEAVE_MAX_WEEKS_EXTREME_PRETERM', 'Uzupełniający — przed 28. tc lub do 1000 g', 15),
    weeks('SUPPLEMENTARY_LEAVE_MAX_WEEKS', 'Uzupełniający — pozostałe przypadki', 8),
    years('FOSTER_CHILD_AGE_LIMIT', 'Limit wieku — rodzina zastępcza', 7),
    years('FOSTER_CHILD_AGE_LIMIT_DEFERRED_SCHOOL', 'Limit wieku — rodzina zastępcza, odroczony obowiązek szkolny', 10),
    years('ADOPTED_CHILD_AGE_LIMIT', 'Limit wieku — przysposobienie', 14),
    days('PREGNANCY_BENEFIT_PERIOD_DAYS', 'Okres zasiłkowy w ciąży (dni)', 270),
    days('SICK_PAY_DAYS', 'Wynagrodzenie chorobowe (dni)', 33),
    days('SICK_PAY_DAYS_AGE_50', 'Wynagrodzenie chorobowe po 50. r.ż. (dni)', 14),
    days('WAITING_PERIOD_MANDATORY_DAYS', 'Wyczekiwanie — obowiązkowe (dni)', 30),
    days('WAITING_PERIOD_VOLUNTARY_DAYS', 'Wyczekiwanie — dobrowolne (dni)', 90),
    days('CARE_BENEFIT_DAYS_PER_YEAR', 'Zasiłek opiekuńczy — dni w roku', 60),
    { key: 'REHABILITATION_MAX_MONTHS', kind: 'MONTHS', label: 'Świadczenie rehabilitacyjne — maks. miesięcy', value: 12 },
  ],
};
