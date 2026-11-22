import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

import { maternityLeaveWeeks } from './maternityLeaveWeeks';
import { parentalLeaveWeeks } from './parentalLeaveWeeks';

/** Adopcja (przysposobienie) albo rodzina zastępcza. */
export type AdoptionKind = 'adoption' | 'foster';

export type AdoptionLeaveInput = {
  childrenCount: number;
  zaZyciem: boolean;
  kind: AdoptionKind;
  /** Wiek dziecka w dniu przyjęcia (lata, może być ułamek). */
  childAgeYears: number;
  /** Rodzina zastępcza i odroczony obowiązek szkolny — wyższy limit wieku. */
  deferredSchool?: boolean;
};

export type AdoptionLeave = {
  /** Urlop na warunkach urlopu macierzyńskiego (tyg.). */
  maternity: number;
  parental: number;
  /** Do jakiego wieku dziecka przysługuje urlop (lata). */
  ageLimit: number;
  note: string;
};

const WEEKS_PER_YEAR = 52.18;

/**
 * Wymiar urlopu przy przyjęciu dziecka na wychowanie (art. 183 KP): pełny, jeśli dziecko zdąży przed
 * limitem wieku; inaczej do limitu wieku, ale nie krócej niż 9 tyg., a rodzicielski skrócony.
 */
export function adoptionLeaveWeeks(input: AdoptionLeaveInput, params: LegalParams = LEGAL_PARAMS): AdoptionLeave {
  const { adoption } = params;
  const fullMaternity = maternityLeaveWeeks(input.childrenCount, params);
  const fullParental = parentalLeaveWeeks(input.childrenCount, input.zaZyciem, params);
  const ageLimit =
    input.kind === 'adoption'
      ? adoption.ageLimitAdoption
      : input.deferredSchool
        ? adoption.ageLimitFosterDeferredSchool
        : adoption.ageLimitFoster;
  const weeksLeft = Math.floor((ageLimit - Math.max(0, input.childAgeYears)) * WEEKS_PER_YEAR);

  if (weeksLeft <= 0) {
    return {
      maternity: 0,
      parental: 0,
      ageLimit,
      note: `Dziecko ma już ${ageLimit} lat — urlop na warunkach urlopu macierzyńskiego nie przysługuje.`,
    };
  }
  if (weeksLeft >= fullMaternity) {
    return {
      maternity: fullMaternity,
      parental: fullParental,
      ageLimit,
      note: `Pełny wymiar: ${fullMaternity} tyg. + rodzicielski ${fullParental} tyg. (limit wieku: ${ageLimit} lat).`,
    };
  }
  const parental = input.zaZyciem ? adoption.parentalMinWeeksZaZyciem : adoption.parentalMinWeeks;
  return {
    maternity: Math.max(adoption.minWeeks, weeksLeft),
    parental,
    ageLimit,
    note: `Dziecko zbliża się do limitu wieku (${ageLimit} lat): urlop trwa do tego wieku, ale nie krócej niż ${adoption.minWeeks} tyg.; rodzicielski ${parental} tyg. (art. 183 § 3 i § 4 KP).`,
  };
}
