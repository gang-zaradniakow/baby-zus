// Generates golden test cases: the frontend prototype (mZUS dla Rodzica, js/calc.js) computes the expected results,
// the backend tests check that Java gives the same answers.
//
// Usage: node tools/golden/generate.mjs <path-to-mockup-directory>
// Output: src/test/resources/golden/<area>.json (committed; tests do not need Node).
//
// The mockup works on local dates, so the time zone is fixed to the legal one before any Date is created.
process.env.TZ = 'Europe/Warsaw';

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const mockupDir = process.argv[2];
if (!mockupDir) {
  console.error('Usage: node tools/golden/generate.mjs <path-to-mockup-directory>');
  process.exit(1);
}
const C = await import(pathToFileURL(resolve(mockupDir, 'js', 'calc.js')).href);
const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/test/resources/golden');

const iso = (d) => C.iso(d);

// ---------------------------------------------------------------------------------------------------------------
// Areas: each returns { source, cases: [{ name, input, expected }] }. Add new areas here (one per calculation).
// ---------------------------------------------------------------------------------------------------------------
const areas = {
  deadlines() {
    const inputs = [
      // within X days after the event (moved to the next working day)
      ['DAYS_AFTER', '2026-11-21', 21, 'ends on a Saturday'],
      ['DAYS_AFTER', '2026-12-03', 21, 'ends on Christmas Eve 2026'],
      ['DAYS_AFTER', '2025-12-03', 21, 'ends on Christmas Eve 2025, first year it is free'],
      ['DAYS_AFTER', '2024-12-03', 21, 'Christmas Eve 2024 is a working day'],
      ['DAYS_AFTER', '2026-03-16', 21, 'ends on Easter Monday'],
      ['DAYS_AFTER', '2026-11-02', 21, 'ends on a Monday'],
      ['DAYS_AFTER', '2026-05-12', 21, 'ends on a Tuesday'],
      ['DAYS_AFTER', '2026-04-20', 7, 'seven days, working day'],
      // at least X days before the event (never moved forward)
      ['DAYS_BEFORE', '2026-06-25', 21, 'falls on Corpus Christi'],
      ['DAYS_BEFORE', '2026-03-29', 21, 'falls on a Sunday'],
      ['DAYS_BEFORE', '2027-01-20', 14, 'falls on Epiphany'],
      ['DAYS_BEFORE', '2026-11-23', 7, 'falls on a working day'],
      // within X months after the event
      ['MONTHS_AFTER', '2026-11-30', 3, 'end of month, ends on a Sunday'],
      ['MONTHS_AFTER', '2026-01-31', 1, 'end of January to end of February, Saturday'],
      ['MONTHS_AFTER', '2026-10-31', 6, 'end of month, working day'],
      ['MONTHS_AFTER', '2026-08-15', 12, 'ends on Assumption Day'],
    ];
    return {
      source: 'js/calc.js: deadline(), deadlineMonths()',
      cases: inputs.map(([kind, event, amount, name]) => {
        const d = C.parseISO(event);
        const r = kind === 'MONTHS_AFTER' ? C.deadlineMonths(d, amount) : C.deadline(d, amount, kind === 'DAYS_BEFORE' ? 'before' : 'after');
        return {
          name: `${kind} ${amount} from ${event}: ${name}`,
          input: { kind, event, amount },
          expected: { type: r.type.toUpperCase(), raw: iso(r.raw), legal: iso(r.legal), shifted: r.shifted, reason: r.reason, safe: iso(r.safe) },
        };
      }),
    };
  },

  holidays() {
    return {
      source: 'js/calc.js: holidays()',
      cases: [2024, 2025, 2026, 2027, 2028].map((year) => ({
        name: `holidays ${year}`,
        input: { year },
        expected: { holidays: C.holidays(year).map(([date, name]) => ({ date: iso(date), name })) },
      })),
    };
  },
};

// ---------------------------------------------------------------------------------------------------------------
// Benefits
// ---------------------------------------------------------------------------------------------------------------
const MAIN_TITLE = { prac: 'EMPLOYMENT', zlec: 'MANDATE_CONTRACT', jdg: 'SELF_EMPLOYMENT', brak: 'NONE' };
const LEVEL = { ok: 'OK', info: 'INFO', no: 'NO' };
const checks = (list) => list.map((c) => ({ level: LEVEL[c.lvl], message: c.t }));

// Backend input shape -> mockup shape of resolvePerson(p).t
function mockupTitles(input) {
  const e = input.employment, z = input.mandateContract, j = input.selfEmployment;
  return {
    prac: { on: !!e, pod: e ? e.base : 0, min: e ? e.atLeastMinimumWage : true },
    zlec: { on: !!z, pod: z ? z.base : 0, chor: z ? z.voluntarySickness : false, student: z ? z.student : false },
    jdg: { on: !!j, pod: j ? j.base : 0, chor: j ? j.voluntarySickness : false, ulga: j ? j.startupRelief : false, debt: j ? j.debt : 0 },
    krus: { on: input.agriculturalInsurance },
  };
}

const employment = (base, atLeastMinimumWage = true) => ({ base, atLeastMinimumWage });
const mandate = (base, voluntarySickness = true, student = false) => ({ base, voluntarySickness, student });
const firm = (base, voluntarySickness = true, startupRelief = false, debt = 0) => ({ base, voluntarySickness, startupRelief, debt });
const titles = ({ e = null, z = null, j = null, krus = false }) => ({ employment: e, mandateContract: z, selfEmployment: j, agriculturalInsurance: krus });

areas.insuranceTitles = () => {
  const inputs = [
    ['employment only', titles({ e: employment(5177.4) })],
    ['employment below the minimum base is raised', titles({ e: employment(3000) })],
    ['part-time employment keeps its own base', titles({ e: employment(2000, false) })],
    ['employment without a base', titles({ e: employment(0) })],
    ['mandate contract with voluntary sickness insurance', titles({ z: mandate(3883.05) })],
    ['mandate contract without sickness insurance', titles({ z: mandate(3883.05, false) })],
    ['student on a mandate contract', titles({ z: mandate(3883.05, true, true) })],
    ['own firm with voluntary sickness insurance', titles({ j: firm(4877.11) })],
    ['own firm without sickness insurance', titles({ j: firm(4877.11, false) })],
    ['own firm on startup relief', titles({ j: firm(0, false, true) })],
    ['own firm with blocking debt', titles({ j: firm(4877.11, true, false, 62.4) })],
    ['own firm with debt below the threshold', titles({ j: firm(4877.11, true, false, 40) })],
    ['own firm above the voluntary base limit', titles({ j: firm(25000) })],
    ['full-time employment and own firm', titles({ e: employment(5177.4), j: firm(4877.11) })],
    ['full-time employment and mandate contract', titles({ e: employment(5177.4), z: mandate(3883.05) })],
    ['part-time employment and own firm', titles({ e: employment(2000, false), j: firm(4877.11) })],
    ['part-time employment and mandate contract', titles({ e: employment(2000, false), z: mandate(3883.05) })],
    ['part-time employment and own firm with debt', titles({ e: employment(2000, false), j: firm(4877.11, true, false, 62.4) })],
    ['mandate contract at minimum wage and own firm', titles({ z: mandate(4200), j: firm(4877.11) })],
    ['small mandate contract and own firm', titles({ z: mandate(2000), j: firm(4877.11) })],
    ['small mandate contract and own firm with debt', titles({ z: mandate(2000), j: firm(4877.11, true, false, 62.4) })],
    ['small mandate contract and own firm on startup relief', titles({ z: mandate(2000), j: firm(0, false, true) })],
    ['farmer in KRUS only', titles({ krus: true })],
    ['KRUS and employment', titles({ e: employment(5177.4), krus: true })],
    ['KRUS and own firm', titles({ j: firm(4877.11), krus: true })],
    ['no insurance title', titles({})],
  ];
  return {
    source: 'js/calc.js: resolvePerson()',
    cases: inputs.map(([name, input]) => {
      const r = C.resolvePerson({ t: mockupTitles(input) });
      return {
        name,
        input,
        expected: {
          mainTitle: MAIN_TITLE[r.tytul],
          base: r.podstawa,
          parts: r.parts.map((x) => ({ title: MAIN_TITLE[x.k], base: x.pod })),
          checks: checks(r.checks),
          agriculturalInsurance: r.krus,
          blockingDebt: r.debt,
        },
      };
    }),
  };
};

const year = (...amounts) => amounts.map((a) => (Array.isArray(a) ? { amount: a[0], skip: true } : { amount: a, skip: false }));
const twelve = (amount) => year(...Array(12).fill(amount));

areas.benefitBase = () => {
  const inputs = [
    ['12 months of 6000 PLN, full-time employment', { months: twelve(6000), title: 'EMPLOYMENT', fullTime: true }],
    ['12 months of 3000 PLN, full-time employment (minimum base)', { months: twelve(3000), title: 'EMPLOYMENT', fullTime: true }],
    ['12 months of 3000 PLN, part-time employment', { months: twelve(3000), title: 'EMPLOYMENT', fullTime: false }],
    ['skipped months are left out of the average', { months: year(6200, 6200, [1500], 6200, 7000, 7000, [800], 7000, 6500, 6500, 6500, 6500), title: 'EMPLOYMENT', fullTime: true }],
    ['months without pay are left out', { months: year(5000, 0, 0, 5200, 5400, 0, 0, 0, 0, 0, 0, 0), title: 'EMPLOYMENT', fullTime: true }],
    ['no months entered', { months: year(0, 0, 0), title: 'EMPLOYMENT', fullTime: true }],
    ['high pay on employment has no upper limit', { months: twelve(25000), title: 'EMPLOYMENT', fullTime: true }],
    ['mandate contract above the voluntary base limit', { months: twelve(30000), title: 'MANDATE_CONTRACT', fullTime: true }],
    ['own firm with the standard base', { months: twelve(5652), title: 'SELF_EMPLOYMENT', fullTime: true }],
    ['mandate contract below the minimum is not raised', { months: twelve(2000), title: 'MANDATE_CONTRACT', fullTime: true }],
  ];
  const MOCKUP_TITLE = { EMPLOYMENT: 'prac', MANDATE_CONTRACT: 'zlec', SELF_EMPLOYMENT: 'jdg' };
  return {
    source: 'js/calc.js: podstawaZ3()',
    cases: inputs.map(([name, input]) => {
      const r = C.podstawaZ3(input.months.map((m) => ({ kwota: m.amount, pomin: m.skip })), MOCKUP_TITLE[input.title], input.fullTime);
      return { name, input, expected: { base: r.p, average: r.avg, monthsCounted: r.n, note: r.note } };
    }),
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Leave dimensions
// ---------------------------------------------------------------------------------------------------------------
areas.adoptionLeave = () => {
  const inputs = [
    ['adoption of a 1-year-old', { children: 1, zaZyciem: false, type: 'ADOPTION', childAge: 1, deferredSchool: false }],
    ['adoption of a newborn', { children: 1, zaZyciem: false, type: 'ADOPTION', childAge: 0, deferredSchool: false }],
    ['adoption close to the age limit', { children: 1, zaZyciem: false, type: 'ADOPTION', childAge: 13.8, deferredSchool: false }],
    ['adoption just before the age limit (minimum 9 weeks)', { children: 1, zaZyciem: false, type: 'ADOPTION', childAge: 13.95, deferredSchool: false }],
    ['adoption at the age limit', { children: 1, zaZyciem: false, type: 'ADOPTION', childAge: 14, deferredSchool: false }],
    ['adoption of twins close to the age limit', { children: 2, zaZyciem: false, type: 'ADOPTION', childAge: 13.5, deferredSchool: false }],
    ['adoption with Za zyciem close to the limit, full maternity', { children: 1, zaZyciem: true, type: 'ADOPTION', childAge: 13.5, deferredSchool: false }],
    ['adoption of twins with Za zyciem close to the limit', { children: 2, zaZyciem: true, type: 'ADOPTION', childAge: 13.6, deferredSchool: false }],
    ['foster family, 2-year-old', { children: 1, zaZyciem: false, type: 'FOSTER_FAMILY', childAge: 2, deferredSchool: false }],
    ['foster family just before 7 years', { children: 1, zaZyciem: false, type: 'FOSTER_FAMILY', childAge: 6.9, deferredSchool: false }],
    ['foster family at 7 years', { children: 1, zaZyciem: false, type: 'FOSTER_FAMILY', childAge: 7, deferredSchool: false }],
    ['foster family at 7 years with deferred school', { children: 1, zaZyciem: false, type: 'FOSTER_FAMILY', childAge: 6.9, deferredSchool: true }],
    ['foster family, three children', { children: 3, zaZyciem: false, type: 'FOSTER_FAMILY', childAge: 3, deferredSchool: false }],
  ];
  const MOCKUP_TYPE = { ADOPTION: 'przysp', FOSTER_FAMILY: 'rz' };
  return {
    source: 'js/calc.js: adoptWeeks()',
    cases: inputs.map(([name, input]) => {
      const r = C.adoptWeeks({ n: input.children, zz: input.zaZyciem, typ: MOCKUP_TYPE[input.type], wiek: input.childAge, odr: input.deferredSchool });
      return { name, input, expected: { maternityWeeks: r.M, parentalWeeks: r.R, ageLimit: r.limit, note: r.note } };
    }),
  };
};

areas.supplementaryLeave = () => {
  const inputs = [
    ['27th week, 950 g, 49 days in hospital', { gestationWeek: 27, birthWeightGrams: 950, hospitalDays: 49, hospitalStartDay: 5 }],
    ['26th week, 1200 g, 120 days (capped at 15)', { gestationWeek: 26, birthWeightGrams: 1200, hospitalDays: 120, hospitalStartDay: 5 }],
    ['30th week, exactly 1000 g', { gestationWeek: 30, birthWeightGrams: 1000, hospitalDays: 30, hospitalStartDay: 5 }],
    ['30th week, 1500 g, 40 days', { gestationWeek: 30, birthWeightGrams: 1500, hospitalDays: 40, hospitalStartDay: 5 }],
    ['34th week, 2200 g, 70 days (capped at 8)', { gestationWeek: 34, birthWeightGrams: 2200, hospitalDays: 70, hospitalStartDay: 5 }],
    ['36th week, no hospital stay', { gestationWeek: 36, birthWeightGrams: 2500, hospitalDays: 0, hospitalStartDay: 5 }],
    ['full term, 3 days in hospital from day 6', { gestationWeek: 38, birthWeightGrams: 3500, hospitalDays: 3, hospitalStartDay: 6 }],
    ['full term, 14 days from day 5', { gestationWeek: 39, birthWeightGrams: 3600, hospitalDays: 14, hospitalStartDay: 5 }],
    ['full term, one day in hospital', { gestationWeek: 38, birthWeightGrams: 3500, hospitalDays: 1, hospitalStartDay: 5 }],
    ['full term, stay started after day 28', { gestationWeek: 38, birthWeightGrams: 3500, hospitalDays: 10, hospitalStartDay: 30 }],
    ['full term, stay started before day 5', { gestationWeek: 40, birthWeightGrams: 3400, hospitalDays: 10, hospitalStartDay: 2 }],
  ];
  return {
    source: 'js/calc.js: uzupelniajacy()',
    cases: inputs.map(([name, input]) => {
      const r = C.uzupelniajacy({ tc: input.gestationWeek, waga: input.birthWeightGrams, dniSzpital: input.hospitalDays, startDzien: input.hospitalStartDay });
      return { name, input, expected: { weeks: r.weeks, limit: r.limit, rule: r.rule } };
    }),
  };
};

mkdirSync(outDir, { recursive: true });
for (const [area, build] of Object.entries(areas)) {
  const file = join(outDir, `${area}.json`);
  writeFileSync(file, JSON.stringify(build(), null, 2) + '\n');
  console.log(`${area}: ${file}`);
}
