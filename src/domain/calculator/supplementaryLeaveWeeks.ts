import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

export type PretermBirth = {
  /** Tydzień ciąży przy porodzie. */
  gestationWeek: number;
  /** Masa urodzeniowa (g). */
  birthWeightGrams: number;
  /** Ile dni dziecko było w szpitalu. */
  hospitalDays: number;
  /** W którym dniu po porodzie zaczął się pobyt w szpitalu (ważne tylko po 37. tygodniu). */
  stayStartDay?: number;
};

export type SupplementaryLeave = {
  weeks: number;
  /** Maks. liczba tygodni dla tej sytuacji. */
  limit: number;
  /** Która reguła zadziałała — do wyjaśnienia rodzicowi. */
  rule: string;
};

/**
 * Uzupełniający urlop macierzyński (art. 180² KP): tydzień urlopu za każdy rozpoczęty tydzień pobytu
 * dziecka w szpitalu — do 15 tyg. (przed 28. tc lub ≤ 1000 g), do 8 tyg. (28.–37. tc), a po 37. tc
 * tylko przy pobycie min. 2 dni rozpoczętym między 5. a 28. dniem po porodzie.
 */
export function supplementaryLeaveWeeks(birth: PretermBirth, params: LegalParams = LEGAL_PARAMS): SupplementaryLeave {
  const { veryPreterm, preterm } = params.supplementaryMaxWeeks;
  const stayStartDay = birth.stayStartDay ?? 5;
  let limit: number;
  let rule: string;

  if (birth.gestationWeek < 28 || birth.birthWeightGrams <= 1000) {
    limit = veryPreterm;
    rule = `Urodzenie przed 28. tygodniem ciąży lub masa ≤ 1000 g: tydzień urlopu za każdy tydzień pobytu w szpitalu, do ${veryPreterm} tygodni.`;
  } else if (birth.gestationWeek < 37) {
    limit = preterm;
    rule = `Urodzenie między 28. a 37. tygodniem ciąży i masa > 1000 g: tydzień za tydzień pobytu, do ${preterm} tygodni.`;
  } else if (birth.hospitalDays >= 2 && stayStartDay >= 5 && stayStartDay <= 28) {
    limit = preterm;
    rule = 'Urodzenie po 37. tygodniu ciąży: pobyt min. 2 kolejne dni, rozpoczęty między 5. a 28. dniem po porodzie.';
  } else {
    return {
      weeks: 0,
      limit: 0,
      rule: 'Po 37. tygodniu urlop przysługuje, gdy pobyt w szpitalu trwa min. 2 kolejne dni i zaczyna się między 5. a 28. dniem po porodzie.',
    };
  }

  const weeks = Math.min(Math.ceil(Math.max(0, birth.hospitalDays) / 7), limit);
  return { weeks, limit, rule };
}
