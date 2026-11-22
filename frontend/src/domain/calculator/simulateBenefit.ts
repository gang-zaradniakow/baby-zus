import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { addDays } from '@/domain/dates/calendarDate';
import { formatMoney } from '@/utils/formatMoney';

import { adoptionLeaveWeeks } from './adoptionLeaveWeeks';
import type { BenefitSegment, BenefitSimulation, Parent, SimulationInput } from './BenefitSimulation';
import type { CalcCheck } from './CalcCheck';
import { maternityLeaveWeeks } from './maternityLeaveWeeks';
import { parentalLeaveWeeks } from './parentalLeaveWeeks';
import { priceSegments } from './priceSegments';
import type { PersonResolution } from './resolvePerson';
import { supplementaryLeaveWeeks } from './supplementaryLeaveWeeks';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value || 0));

const isInsured = (p: PersonResolution) => p.title !== 'none';
/** Sama firma z zaległością — zasiłek wstrzymany. */
const isBlocked = (p: PersonResolution, params: LegalParams) => p.title === 'jdg' && p.debt > params.debtLimit;

function eligibilityChecks(input: SimulationInput, params: LegalParams): CalcCheck[] {
  const { mother, father } = input;
  const checks: CalcCheck[] = [];

  if (!isInsured(mother)) {
    checks.push({
      level: 'no',
      text: mother.krus
        ? 'Mama: ubezpieczenie w KRUS — zasiłek macierzyński wypłaca KRUS, nie ZUS.'
        : 'Mama: brak ubezpieczenia chorobowego w dniu porodu/przyjęcia — zasiłek macierzyński z ZUS nie przysługuje (zamiast niego: świadczenie rodzicielskie z gminy).',
    });
  } else if (isBlocked(mother, params)) {
    checks.push({
      level: 'no',
      text: `Mama: zaległość w składkach ${formatMoney(mother.debt)} > ${formatMoney(params.debtLimit)} — zasiłek wstrzymany do spłaty całości; brak spłaty w 6 mies. = utrata prawa.`,
    });
  } else {
    checks.push({
      level: 'ok',
      text: `Mama: ubezpieczenie chorobowe ${mother.title === 'uop' ? 'obowiązkowe (pracownica)' : 'dobrowolne'} — zasiłek przysługuje (bez okresu wyczekiwania).`,
    });
  }

  if (!isInsured(father)) {
    checks.push({
      level: 'info',
      text: father.krus
        ? 'Tata: KRUS — zasiłek za urlop ojcowski / rodzicielski nie z ZUS.'
        : 'Tata: bez ubezpieczenia chorobowego — nie pobiera zasiłku (urlop ojcowski i 9 tygodni przepadają).',
    });
  } else if (isBlocked(father, params)) {
    checks.push({ level: 'no', text: `Tata: zaległość w składkach ${formatMoney(father.debt)} — zasiłek wstrzymany do spłaty.` });
  } else {
    checks.push({ level: 'ok', text: 'Tata: ubezpieczony — może wziąć urlop ojcowski, swoje 9 tygodni i część urlopu mamy.' });
  }
  return checks;
}

/**
 * Zintegrowany kalkulator zasiłku macierzyńskiego dla obojga rodziców (poród albo adopcja):
 * podział urlopów, wariant 81,5% / 100% + 70%, wcześniak, ojcowski, praca na urlopie, kwoty.
 * Port `simulate` z prototypu.
 */
export function simulateBenefit(input: SimulationInput, params: LegalParams = LEGAL_PARAMS): BenefitSimulation {
  const { rates, nonTransferableWeeks } = params;
  const notes: string[] = [];
  const checks = eligibilityChecks(input, params);
  const childrenCount = clamp(input.childrenCount, 1, 5);

  let maternityWeeks = maternityLeaveWeeks(childrenCount, params);
  let parentalWeeks = parentalLeaveWeeks(childrenCount, input.zaZyciem, params);
  if (input.situation === 'adoption' && input.adoption) {
    const adoption = adoptionLeaveWeeks({ childrenCount, zaZyciem: input.zaZyciem, ...input.adoption }, params);
    maternityWeeks = adoption.maternity;
    parentalWeeks = adoption.parental;
    notes.push(adoption.note);
  }

  const empty: BenefitSimulation = {
    maternityWeeks,
    parentalWeeks,
    supplementaryWeeks: 0,
    segments: [],
    checks,
    notes,
    totals: { mother: 0, father: 0, family: 0 },
    averaged: false,
  };
  if (maternityWeeks === 0) return empty;

  const motherOn = isInsured(input.mother) && !isBlocked(input.mother, params);
  const fatherOn = isInsured(input.father) && !isBlocked(input.father, params);
  const { fatherPlan, work } = input;

  // Macierzyński: przy porodzie pierwsze 14 tyg. tylko dla mamy.
  const motherOnly = input.situation === 'birth' ? params.motherOnlyMaternityWeeks : 0;
  const fatherMaternity =
    motherOn && fatherOn ? clamp(fatherPlan.maternityTakeover, 0, maternityWeeks - motherOnly) : 0;
  const motherMaternity = motherOn ? maternityWeeks - fatherMaternity : 0;

  const supplementaryWeeks =
    input.situation === 'birth' && input.preterm
      ? supplementaryLeaveWeeks({ ...input.preterm, stayStartDay: input.preterm.stayStartDay ?? 5 }, params).weeks
      : 0;

  // Rodzicielski: 9 tygodni nieprzenoszalnych dla każdego z rodziców.
  const fatherParental = fatherOn ? clamp(fatherPlan.parentalWeeks, 0, parentalWeeks - nonTransferableWeeks) : 0;
  const motherParental = motherOn ? Math.min(parentalWeeks - fatherParental, parentalWeeks - nonTransferableWeeks) : 0;
  if (fatherOn && fatherParental < nonTransferableWeeks) {
    notes.push(
      `Tata wykorzystuje ${fatherParental} z ${nonTransferableWeeks} nieprzenoszalnych tygodni — ${nonTransferableWeeks - fatherParental} tyg. przepadnie.`,
    );
  }

  const averaged = input.variant === 'averaged' && motherOn;
  if (input.variant === 'averaged' && !motherOn) {
    notes.push('Wariant 81,5% wymaga wniosku ubezpieczonej mamy — liczymy wariant 100% + 70%.');
  }
  const maternityRate = averaged ? rates.averaged : rates.maternity;
  const parentalRate = averaged ? rates.averaged : rates.parental;

  const workFraction = clamp(work.fraction, 0, 0.5);
  const segments: BenefitSegment[] = [];
  const cursor: Record<Parent, number> = { mother: 0, father: 0 };

  /** Dokłada odcinek; bez `fromDay` — zaraz po poprzednim odcinku tej osoby. */
  const push = (who: Parent, label: string, weeks: number, rate: number, factor = 1, fromDay?: number) => {
    if (weeks <= 0) return;
    const days = Math.round(weeks * 7);
    let offset = fromDay;
    if (offset === undefined) {
      offset = cursor[who];
      cursor[who] += days;
    }
    segments.push({
      who,
      label,
      weeks: Math.round(weeks * 10) / 10,
      rate,
      factor,
      from: addDays(input.startDate, offset),
      to: addDays(input.startDate, offset + days - 1),
    });
  };

  push(
    'mother',
    input.situation === 'adoption' ? 'Urlop na warunkach macierzyńskiego' : 'Urlop macierzyński',
    motherMaternity,
    maternityRate,
  );
  if (fatherMaternity) {
    cursor.father = Math.max(cursor.father, cursor.mother);
    push('father', 'Część urlopu macierzyńskiego (przejęta)', fatherMaternity, maternityRate);
  }
  const afterMaternity = Math.max(cursor.mother, cursor.father);

  if (supplementaryWeeks) {
    if (motherOn) {
      cursor.mother = afterMaternity;
      push('mother', 'Uzupełniający urlop macierzyński', supplementaryWeeks, rates.supplementary);
    } else if (fatherOn) {
      cursor.father = afterMaternity;
      push('father', 'Uzupełniający urlop macierzyński', supplementaryWeeks, rates.supplementary);
    }
  }

  /** Rodzicielski jednej osoby; `rateSplit` — [tygodnie, stopa] w kolejności. */
  const pushParental = (who: Parent, weeks: number, rateSplit: [number, number][]) => {
    let combined = work.who === who ? clamp(work.weeks, 0, weeks) : 0;
    for (const [splitWeeks, rate] of rateSplit) {
      if (splitWeeks <= 0) continue;
      const withWork = Math.min(combined, splitWeeks);
      combined -= withWork;
      push(who, 'Urlop rodzicielski', splitWeeks - withWork, rate);
      if (withWork > 0) {
        push(who, `Rodzicielski + praca (${Math.round(workFraction * 100)}% etatu)`, withWork, rate, 1 - workFraction);
        push(who, 'Wydłużenie rodzicielskiego (za pracę)', withWork * workFraction, rate);
      }
    }
  };

  if (motherParental) {
    cursor.mother = Math.max(
      cursor.mother,
      afterMaternity + (supplementaryWeeks && motherOn ? supplementaryWeeks * 7 : 0),
    );
    pushParental('mother', motherParental, [[motherParental, parentalRate]]);
  }
  if (fatherParental) {
    cursor.father = Math.max(cursor.father, cursor.mother, afterMaternity);
    const own = Math.min(fatherParental, nonTransferableWeeks);
    // 9 tygodni taty zawsze 70% — także w wariancie 81,5%.
    pushParental('father', fatherParental, [
      [own, rates.parental],
      [fatherParental - own, parentalRate],
    ]);
  }
  if (fatherOn && fatherPlan.paternity) {
    push('father', 'Urlop ojcowski', params.paternityWeeks, rates.paternity, 1, 0);
  }

  // Limity łączenia urlopu rodzicielskiego z pracą.
  if (work.who !== 'none' && workFraction > 0) {
    const extension = clamp(work.weeks, 0, work.who === 'mother' ? motherParental : fatherParental) * workFraction;
    const limits = params.parentalWeeksWithWorkMax;
    const multiple = childrenCount > 1;
    const max = input.zaZyciem
      ? multiple
        ? limits.zaZyciemMultiple
        : limits.zaZyciemSingle
      : multiple
        ? limits.multiple
        : limits.single;
    notes.push(
      `Łączenie z pracą: zasiłek w tym czasie maleje do ${Math.round((1 - workFraction) * 100)}%, a urlop wydłuża się o ${Math.round(extension * 10) / 10} tyg. Łączna kwota zasiłku się nie zmienia — jest rozłożona na dłużej, a do tego dostajesz wynagrodzenie. Limit urlopu: ${max} tyg.`,
    );
    if (parentalWeeks + extension > max) {
      checks.push({ level: 'no', text: `Przekroczono maksymalny wymiar urlopu rodzicielskiego przy pracy (${max} tyg.).` });
    }
  }

  const priced = priceSegments(segments, { mother: input.mother.base, father: input.father.base }, params);
  if (priced.minimumApplied) {
    notes.push(
      `Zastosowano minimum: zasiłek na rękę nie może być niższy niż ${formatMoney(params.parentalBenefitMonthly, 0)} miesięcznie (art. 31 ust. 3a).`,
    );
  }
  if (averaged) {
    notes.push('Warunek 81,5%: co najmniej 1 dzień urlopu rodzicielskiego musi przypaść w 1. roku życia dziecka; 9 tygodni taty zawsze 70%.');
  }

  const sum = (who: Parent) => priced.segments.filter((s) => s.who === who).reduce((total, s) => total + s.total, 0);
  const mother = sum('mother');
  const father = sum('father');

  return {
    ...empty,
    supplementaryWeeks,
    segments: priced.segments,
    totals: { mother, father, family: mother + father },
    averaged,
  };
}
