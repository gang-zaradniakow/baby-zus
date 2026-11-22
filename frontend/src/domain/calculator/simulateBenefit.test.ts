import { toISODate } from '@/domain/dates/calendarDate';
import { day } from '@/testing/dates';

import type { SimulationInput } from './BenefitSimulation';
import { resolvePerson } from './resolvePerson';
import { simulateBenefit } from './simulateBenefit';

const employee = (base: number) => resolvePerson({ uop: { on: true, base, atLeastMinWage: false } });
const uninsured = resolvePerson({});

function input(overrides: Partial<SimulationInput> = {}): SimulationInput {
  return {
    situation: 'birth',
    startDate: day(2026, 12, 1),
    childrenCount: 1,
    zaZyciem: false,
    variant: 'standard',
    mother: employee(6000),
    father: uninsured,
    fatherPlan: { paternity: false, parentalWeeks: 0, maternityTakeover: 0 },
    work: { who: 'none', fraction: 0.5, weeks: 0 },
    ...overrides,
  };
}

const summary = (result: ReturnType<typeof simulateBenefit>) =>
  result.segments.map((s) => `${s.who}: ${s.label} ${s.weeks} tyg. ${Math.round(s.rate * 1000) / 10}%`);

describe('simulateBenefit', () => {
  it('sama mama, 100% + 70%: 20 tyg. macierzyńskiego i 32 tyg. rodzicielskiego', () => {
    const result = simulateBenefit(input());

    expect(summary(result)).toEqual(['mother: Urlop macierzyński 20 tyg. 100%', 'mother: Urlop rodzicielski 32 tyg. 70%']);
    // 6000 zł → 5280 zł na rękę; 70% = 4200 → 3696 zł na rękę.
    expect(result.segments.map((s) => s.monthlyNet)).toEqual([5280, 3696]);
    expect(result.totals.mother).toBeCloseTo((5280 * 140) / 30 + (3696 * 224) / 30, 2);
    expect(toISODate(result.segments[1].from)).toBe('2027-04-20');
  });

  it('wariant 81,5% — ta sama stopa przez cały okres', () => {
    const result = simulateBenefit(input({ variant: 'averaged' }));

    expect(result.averaged).toBe(true);
    expect(result.segments.map((s) => s.rate)).toEqual([0.815, 0.815]);
    expect(result.segments[0].monthlyNet).toBe(4303);
  });

  it('tata ubezpieczony: swoje 9 tyg. rodzicielskiego po mamie (zawsze 70%) i ojcowski od porodu', () => {
    const result = simulateBenefit(
      input({
        variant: 'averaged',
        father: employee(5000),
        fatherPlan: { paternity: true, parentalWeeks: 9, maternityTakeover: 0 },
      }),
    );
    const fatherSegments = result.segments.filter((s) => s.who === 'father');

    expect(fatherSegments.map((s) => [s.label, s.weeks, s.rate])).toEqual([
      ['Urlop rodzicielski', 9, 0.7],
      ['Urlop ojcowski', 2, 1],
    ]);
    expect(toISODate(fatherSegments[0].from)).toBe('2027-11-30'); // po 52 tyg. mamy
    expect(toISODate(fatherSegments[1].from)).toBe('2026-12-01');
    expect(result.totals.family).toBeCloseTo(result.totals.mother + result.totals.father, 5);
  });

  it('tata bez swoich 9 tygodni — uwaga, że przepadną', () => {
    const result = simulateBenefit(input({ father: employee(5000) }));
    expect(result.notes.join(' ')).toMatch(/9 tyg\. przepadnie/);
  });

  it('tata przejmuje macierzyński — mama zostaje z 14 tyg., tata zaczyna po nich', () => {
    const result = simulateBenefit(
      input({ father: employee(5000), fatherPlan: { paternity: false, parentalWeeks: 9, maternityTakeover: 10 } }),
    );
    const takeover = result.segments.find((s) => s.label.startsWith('Część urlopu macierzyńskiego'));

    expect(result.segments[0].weeks).toBe(14);
    expect(takeover?.weeks).toBe(6); // najwyżej 20 − 14
    expect(toISODate(takeover!.from)).toBe(toISODate(day(2027, 3, 9)));
  });

  it('wcześniak — uzupełniający urlop zaraz po macierzyńskim', () => {
    const result = simulateBenefit(input({ preterm: { gestationWeek: 32, birthWeightGrams: 1800, hospitalDays: 21 } }));

    expect(result.supplementaryWeeks).toBe(3);
    expect(summary(result)[1]).toBe('mother: Uzupełniający urlop macierzyński 3 tyg. 100%');
    expect(toISODate(result.segments[2].from)).toBe('2027-05-11'); // rodzicielski po 23 tyg.
  });

  it('praca na pół etatu przez 8 tyg. rodzicielskiego — zasiłek 50%, urlop dłuższy o 4 tyg.', () => {
    const result = simulateBenefit(input({ work: { who: 'mother', fraction: 0.5, weeks: 8 } }));

    expect(summary(result).slice(1)).toEqual([
      'mother: Urlop rodzicielski 24 tyg. 70%',
      'mother: Rodzicielski + praca (50% etatu) 8 tyg. 70%',
      'mother: Wydłużenie rodzicielskiego (za pracę) 4 tyg. 70%',
    ]);
    expect(result.segments[2].factor).toBe(0.5);
    expect(result.notes.join(' ')).toMatch(/wydłuża się o 4 tyg/);
  });

  it('niska podstawa — minimum 1000 zł na rękę', () => {
    const result = simulateBenefit(input({ mother: employee(1000) }));

    expect(result.segments[1].monthlyNet).toBe(1000);
    expect(result.notes.join(' ')).toMatch(/Zastosowano minimum/);
  });

  it('mama bez ubezpieczenia — bez zasiłku z ZUS, wariant 81,5% niedostępny', () => {
    const result = simulateBenefit(input({ mother: uninsured, variant: 'averaged' }));

    expect(result.segments).toEqual([]);
    expect(result.averaged).toBe(false);
    expect(result.checks[0]).toMatchObject({ level: 'no' });
  });

  it('adopcja dziecka blisko limitu wieku — skrócony urlop i uwaga', () => {
    const result = simulateBenefit(
      input({ situation: 'adoption', adoption: { kind: 'adoption', childAgeYears: 13.9 } }),
    );

    expect(result).toMatchObject({ maternityWeeks: 9, parentalWeeks: 38 });
    expect(result.segments[0].label).toBe('Urlop na warunkach macierzyńskiego');
    expect(result.notes[0]).toMatch(/limitu wieku/);
  });
});
