/**
 * Parametry prawne kalkulatora (stan na 2026: ustawa zasiłkowa Dz.U. 2026 poz. 854, Kodeks pracy
 * Dz.U. 2026 poz. 1245, Poradnik ZUS 2026) — przeniesione z `K` w prototypie (js/data.js).
 * Funkcje silnika przyjmują je jako argument, żeby Panel administracyjny (Faza 5) mógł je nadpisać.
 */
export type LegalParams = {
  /** Płaca minimalna brutto (MIN_WAGE). */
  minWage: number;
  /** Składki społeczne pracownika odliczane od podstawy — 13,71% (SKLADKI). */
  socialContributionRate: number;
  /** Minimalna podstawa zasiłku przy pełnym etacie: płaca minimalna − 13,71% (MIN_PODSTAWA). */
  minBenefitBase: number;
  /** Limit podstawy przy dobrowolnym chorobowym: 250% prognozowanego wynagrodzenia − 13,71% (MAX_PODSTAWA_DOBR). */
  maxVoluntaryBase: number;
  /** Standardowa podstawa składek przedsiębiorcy: 60% prognozowanego przeciętnego wynagrodzenia (JDG_PODSTAWA_STD). */
  businessStandardBase: number;
  /** Świadczenie rodzicielskie i zarazem minimum zasiłku macierzyńskiego na rękę (SW_RODZICIELSKIE). */
  parentalBenefitMonthly: number;
  /** Ile tygodni wypłaca się świadczenie rodzicielskie: 1, 2, 3, 4, 5+ dzieci (SW_RODZ_WEEKS). */
  parentalBenefitWeeks: readonly number[];
  /** Zaległość w składkach przedsiębiorcy blokująca zasiłek — 1% płacy minimalnej (DEBT_LIMIT). */
  debtLimit: number;
  /** Zaliczka PIT od zasiłku — orientacyjnie, bez kwoty zmniejszającej (PIT). */
  pitRate: number;
  /** Zasiłek pogrzebowy (ZAS_POGRZEBOWY) — od 1.01.2026. */
  funeralAllowance: number;

  rates: {
    maternity: number;
    parental: number;
    /** Wariant uśredniony przy wniosku do 21 dni po porodzie. */
    averaged: number;
    supplementary: number;
    paternity: number;
    pregnancySickness: number;
    pregnancyRehabilitation: number;
  };

  /** Urlop macierzyński: 1, 2, 3, 4, 5+ dzieci z jednego porodu (MAC_WEEKS). */
  maternityWeeks: readonly number[];
  parentalWeeks: { single: number; multiple: number; zaZyciemSingle: number; zaZyciemMultiple: number };
  /** Maks. wymiar rodzicielskiego przy łączeniu z pracą. */
  parentalWeeksWithWorkMax: { single: number; multiple: number; zaZyciemSingle: number; zaZyciemMultiple: number };
  /** Nieprzenoszalna część rodzicielskiego dla każdego z rodziców (NIEPRZENOSZALNE). */
  nonTransferableWeeks: number;
  paternityWeeks: number;
  /** Pierwsze tygodnie macierzyńskiego tylko dla matki (MAC_TYLKO_MAMA). */
  motherOnlyMaternityWeeks: number;

  adoption: {
    minWeeks: number;
    parentalMinWeeks: number;
    parentalMinWeeksZaZyciem: number;
    /** Do jakiego wieku dziecka przysługuje urlop (lata). */
    ageLimitAdoption: number;
    ageLimitFoster: number;
    ageLimitFosterDeferredSchool: number;
  };

  /** Uzupełniający urlop macierzyński (wcześniaki): limity w tygodniach. */
  supplementaryMaxWeeks: { veryPreterm: number; preterm: number };

  sickness: {
    /** Okres zasiłkowy w ciąży (dni). */
    pregnancyPeriodDays: number;
    /** Wynagrodzenie chorobowe płacone przez pracodawcę (dni w roku); 50+ lat — krócej. */
    employerPaidDays: number;
    employerPaidDaysAge50: number;
    waitingDaysMandatory: number;
    waitingDaysVoluntary: number;
    rehabilitationMaxMonths: number;
  };
};

export const LEGAL_PARAMS: LegalParams = {
  minWage: 4806,
  socialContributionRate: 0.1371,
  minBenefitBase: 4147.1,
  maxVoluntaryBase: 20321.3,
  businessStandardBase: 5652,
  parentalBenefitMonthly: 1000,
  parentalBenefitWeeks: [52, 65, 67, 69, 71],
  debtLimit: 48.06,
  pitRate: 0.12,
  funeralAllowance: 7000,
  rates: {
    maternity: 1,
    parental: 0.7,
    averaged: 0.815,
    supplementary: 1,
    paternity: 1,
    pregnancySickness: 1,
    pregnancyRehabilitation: 1,
  },
  maternityWeeks: [20, 31, 33, 35, 37],
  parentalWeeks: { single: 41, multiple: 43, zaZyciemSingle: 65, zaZyciemMultiple: 67 },
  parentalWeeksWithWorkMax: { single: 82, multiple: 86, zaZyciemSingle: 130, zaZyciemMultiple: 134 },
  nonTransferableWeeks: 9,
  paternityWeeks: 2,
  motherOnlyMaternityWeeks: 14,
  adoption: {
    minWeeks: 9,
    parentalMinWeeks: 38,
    parentalMinWeeksZaZyciem: 62,
    ageLimitAdoption: 14,
    ageLimitFoster: 7,
    ageLimitFosterDeferredSchool: 10,
  },
  supplementaryMaxWeeks: { veryPreterm: 15, preterm: 8 },
  sickness: {
    pregnancyPeriodDays: 270,
    employerPaidDays: 33,
    employerPaidDaysAge50: 14,
    waitingDaysMandatory: 30,
    waitingDaysVoluntary: 90,
    rehabilitationMaxMonths: 12,
  },
};
