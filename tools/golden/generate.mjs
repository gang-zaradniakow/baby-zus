// Generates golden test cases: the frontend prototype (mZUS dla Rodzica, js/calc.js) computes the expected results,
// the backend tests check that Java gives the same answers.
//
// Usage: node tools/golden/generate.mjs <path-to-mockup-directory>
// Output: src/test/resources/golden/<area>.json (committed; tests do not need Node).
//
// The mockup works on local dates, so the time zone is fixed to the legal one before any Date is created.
process.env.TZ = 'Europe/Warsaw';

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

// ---------------------------------------------------------------------------------------------------------------
// Sickness benefit in pregnancy (resolvePerson() + chorobowyMulti(), as the calculator screen does)
// ---------------------------------------------------------------------------------------------------------------
areas.pregnancySickness = () => {
  const leave = (days, extra = {}) => ({ days, usedSickPayDays: 0, aged50OrMore: false, insuredDays: 365, ...extra });
  const inputs = [
    ['employment, 30 days: sick pay only', titles({ e: employment(5177.4) }), leave(30)],
    ['employment, 60 days: sick pay then benefit', titles({ e: employment(5177.4) }), leave(60)],
    ['employment, 20 sick-pay days already used', titles({ e: employment(5177.4) }), leave(60, { usedSickPayDays: 20 })],
    ['employment, aged 50: 14 days of sick pay', titles({ e: employment(5177.4) }), leave(30, { aged50OrMore: true })],
    ['employment, all sick-pay days used', titles({ e: employment(5177.4) }), leave(40, { usedSickPayDays: 400 })],
    ['employment, 300 days: rehabilitation benefit after 270', titles({ e: employment(5177.4) }), leave(300)],
    ['employment, 700 days: rehabilitation capped at 12 months', titles({ e: employment(5177.4) }), leave(700)],
    ['employment, waiting period not met', titles({ e: employment(5177.4) }), leave(30, { insuredDays: 20 })],
    ['own firm, 90 days: benefit from the first day', titles({ j: firm(4877.11) }), leave(90)],
    ['own firm, waiting period of 90 days not met', titles({ j: firm(4877.11) }), leave(30, { insuredDays: 60 })],
    ['mandate contract, 45 days', titles({ z: mandate(3883.05) }), leave(45, { insuredDays: 100 })],
    ['part-time employment and own firm, 60 days', titles({ e: employment(2000, false), j: firm(4877.11) }), leave(60)],
    ['full-time employment and own firm: only employment', titles({ e: employment(5177.4), j: firm(4877.11) }), leave(60)],
    ['no insurance title', titles({}), leave(30)],
    ['own firm with blocking debt', titles({ j: firm(4877.11, true, false, 62.4) }), leave(30)],
    ['farmer in KRUS', titles({ krus: true }), leave(30)],
    ['employment without a base', titles({ e: employment(0) }), leave(30)],
  ];
  return {
    source: 'js/calc.js: resolvePerson() + chorobowyMulti(), netto()',
    cases: inputs.map(([name, t, l]) => {
      const r = C.chorobowyMulti(C.resolvePerson({ t: mockupTitles(t) }), { dni: l.days, uzyte: l.usedSickPayDays, wiek50: l.aged50OrMore, staz: l.insuredDays });
      return {
        name,
        input: { titles: t, leave: l },
        expected: {
          checks: checks(r.checks),
          parts: r.parts.map((p) => ({ label: p.label, days: p.dni, rate: p.pct, amount: p.kwota })),
          total: r.total,
          netTotal: C.netto(r.total),
        },
      };
    }),
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Maternity benefit simulator: leave split between parents and timeline segments (simulate(), without work)
// ---------------------------------------------------------------------------------------------------------------
// Parents are given as resolved insurance (output of resolvePerson()): mainTitle, base, blockingDebt, agricultural.
const parent = (mainTitle, base, blockingDebt = 0, agriculturalInsurance = false) => ({ mainTitle, base, blockingDebt, agriculturalInsurance });
const MOCKUP_TYTUL = { EMPLOYMENT: 'prac', MANDATE_CONTRACT: 'zlec', SELF_EMPLOYMENT: 'jdg', NONE: 'brak' };
const insured = parent('EMPLOYMENT', 6000);
const father = (insurance = insured, choices = {}) => ({ insurance, paternityLeave: true, parentalWeeks: 9, maternityWeeksTaken: 0, ...choices });
const simulation = (o) => ({
  situation: 'BIRTH', startDate: '2026-03-02', children: 1, zaZyciem: false, preterm: null, adoption: null,
  variant: 'STANDARD', mother: insured, father: father(), ...o,
});
function mockupSimulation(input) {
  const person = (p) => ({ tytul: MOCKUP_TYTUL[p.mainTitle], podstawa: p.base, debt: p.blockingDebt, krus: p.agriculturalInsurance });
  return {
    sit: input.situation === 'BIRTH' ? 'birth' : 'adopt',
    date: input.startDate, n: input.children, zz: input.zaZyciem,
    preterm: input.preterm ? { on: true, tc: input.preterm.gestationWeek, waga: input.preterm.birthWeightGrams, dni: input.preterm.hospitalDays } : { on: false },
    adopt: input.adoption ? { typ: input.adoption.type === 'ADOPTION' ? 'przysp' : 'rz', wiek: input.adoption.childAge, odr: input.adoption.deferredSchool } : { typ: 'przysp', wiek: 0, odr: false },
    variant: input.variant === 'AVERAGED' ? 'A' : 'B',
    mama: person(input.mother),
    tata: { ...person(input.father.insurance), ojc: input.father.paternityLeave, rodz: input.father.parentalWeeks, macPrzejecie: input.father.maternityWeeksTaken },
    praca: { kto: 'none', f: 0.5, weeks: 8 },
  };
}
const preterm = (gestationWeek, birthWeightGrams, hospitalDays) => ({ gestationWeek, birthWeightGrams, hospitalDays, hospitalStartDay: 5 });
const adoption = (type, childAge, deferredSchool = false) => ({ type, childAge, deferredSchool });

areas.maternitySegments = () => {
  const inputs = [
    ['birth, one child, both parents employed', simulation({})],
    ['averaged variant 81.5%', simulation({ variant: 'AVERAGED' })],
    ['twins', simulation({ children: 2 })],
    ['Za zyciem certificate', simulation({ zaZyciem: true })],
    ['triplets with Za zyciem, averaged variant', simulation({ children: 3, zaZyciem: true, variant: 'AVERAGED' })],
    ['father takes 6 weeks of maternity leave', simulation({ father: father(insured, { maternityWeeksTaken: 6 }) })],
    ['father asks for more maternity leave than allowed', simulation({ father: father(insured, { maternityWeeksTaken: 10 }) })],
    ['father takes 15 weeks of parental leave', simulation({ father: father(insured, { parentalWeeks: 15 }) })],
    ['father does not use his 9 weeks', simulation({ father: father(insured, { parentalWeeks: 0 }) })],
    ['father without paternity leave', simulation({ father: father(insured, { paternityLeave: false }) })],
    ['father not insured', simulation({ father: father(parent('NONE', 0)) })],
    ['father in KRUS', simulation({ father: father(parent('NONE', 0, 0, true)) })],
    ['father with blocking debt', simulation({ father: father(parent('SELF_EMPLOYMENT', 0, 62.4)) })],
    ['mother not insured, father insured', simulation({ mother: parent('NONE', 0) })],
    ['mother in KRUS', simulation({ mother: parent('NONE', 0, 0, true) })],
    ['mother with blocking debt', simulation({ mother: parent('SELF_EMPLOYMENT', 0, 62.4) })],
    ['mother self-employed with voluntary insurance', simulation({ mother: parent('SELF_EMPLOYMENT', 4877.11) })],
    ['averaged variant but mother not insured', simulation({ variant: 'AVERAGED', mother: parent('NONE', 0) })],
    ['premature baby: supplementary leave for the mother', simulation({ preterm: preterm(27, 950, 49) })],
    ['premature baby, mother not insured: supplementary for the father', simulation({ preterm: preterm(30, 1500, 40), mother: parent('NONE', 0) })],
    ['adoption of a 1-year-old', simulation({ situation: 'ADOPTION', adoption: adoption('ADOPTION', 1) })],
    ['foster family close to the age limit, father takes 5 weeks', simulation({ situation: 'ADOPTION', adoption: adoption('FOSTER_FAMILY', 6.9), father: father(insured, { maternityWeeksTaken: 5 }) })],
    ['adoption of a child over the age limit', simulation({ situation: 'ADOPTION', adoption: adoption('ADOPTION', 14) })],
    ['nobody insured', simulation({ mother: parent('NONE', 0), father: father(parent('NONE', 0)) })],
  ];
  const WHO = { mama: 'MOTHER', tata: 'FATHER' };
  return {
    source: 'js/calc.js: simulate() (leave split and segments; no work, amounts not compared)',
    cases: inputs.map(([name, input]) => {
      const r = C.simulate(mockupSimulation(input));
      return {
        name,
        input,
        expected: {
          maternityWeeks: r.M, parentalWeeks: r.R, supplementaryWeeks: r.U,
          motherMaternityWeeks: r.mMac ?? 0, fatherMaternityWeeks: r.tMac ?? 0,
          motherParentalWeeks: r.mR ?? 0, fatherParentalWeeks: r.tR ?? 0,
          averagedVariant: !!r.A,
          segments: r.segs.map((s) => ({ parent: WHO[s.who], label: s.label, weeks: s.weeks, rate: s.pct, workFactor: s.factor, from: iso(s.from), to: iso(s.to) })),
          checks: checks(r.checks),
          notes: r.notes,
        },
      };
    }),
  };
};

// ---------------------------------------------------------------------------------------------------------------
// Maternity benefit calculator screen: both parents' titles resolved, simulate() with work and amounts, checks
// composed and the alternative benefit (simOut() in js/app.js)
// ---------------------------------------------------------------------------------------------------------------
const family = (o) => ({
  situation: 'BIRTH', startDate: '2026-03-02', children: 1, zaZyciem: false, preterm: null, adoption: null, variant: 'STANDARD',
  mother: titles({ e: employment(5177.4) }),
  father: { titles: titles({ e: employment(6040.4) }), paternityLeave: true, parentalWeeks: 9, maternityWeeksTaken: 0 },
  work: null, ...o,
});
const dad = (t, choices = {}) => ({ titles: t, paternityLeave: true, parentalWeeks: 9, maternityWeeksTaken: 0, ...choices });
const work = (parent, share, weeks) => ({ parent, share, weeks });

areas.maternityBenefit = () => {
  const inputs = [
    ['both parents employed, standard variant', family({})],
    ['averaged variant 81.5%', family({ variant: 'AVERAGED' })],
    ['low base: the 1000 PLN minimum applies', family({ mother: titles({ e: employment(1500, false) }) })],
    ['mother self-employed, father takes 6 weeks of maternity', family({ mother: titles({ j: firm(4877.11) }), father: dad(titles({ e: employment(6040.4) }), { maternityWeeksTaken: 6 }) })],
    ['mother works half-time for 8 weeks of parental leave', family({ work: work('MOTHER', 0.5, 8) })],
    ['mother works quarter-time for 10 weeks', family({ work: work('MOTHER', 0.25, 10) })],
    ['mother works half-time longer than her parental leave', family({ work: work('MOTHER', 0.5, 40) })],
    ['father works half-time for 12 weeks (own and transferred weeks)', family({ father: dad(titles({ e: employment(6040.4) }), { parentalWeeks: 15 }), work: work('FATHER', 0.5, 12) })],
    ['averaged variant with mother working quarter-time 5 weeks', family({ variant: 'AVERAGED', work: work('MOTHER', 0.25, 5) })],
    ['mother not insured: parental allowance from the municipality', family({ mother: titles({}) })],
    ['mother in KRUS: maternity benefit from KRUS', family({ mother: titles({ krus: true }) })],
    ['mother with blocking debt', family({ mother: titles({ j: firm(4877.11, true, false, 62.4) }) })],
    ['mother student on a mandate contract', family({ mother: titles({ z: mandate(3000, true, true) }) })],
    ['father with two titles', family({ father: dad(titles({ e: employment(2000, false), j: firm(4877.11) })) })],
    ['father not insured', family({ father: dad(titles({})) })],
    ['twins, mother on minimum, father works half-time', family({ children: 2, mother: titles({ e: employment(1200, false) }), work: work('FATHER', 0.5, 6) })],
    ['premature baby with supplementary leave', family({ preterm: { gestationWeek: 27, birthWeightGrams: 950, hospitalDays: 49, hospitalStartDay: 5 } })],
    ['foster family, child of 2', family({ situation: 'ADOPTION', adoption: { type: 'FOSTER_FAMILY', childAge: 2, deferredSchool: false } })],
    ['nobody insured, triplets', family({ children: 3, mother: titles({}), father: dad(titles({})) })],
    ['Za zyciem, mother works half-time 20 weeks', family({ zaZyciem: true, work: work('MOTHER', 0.5, 20) })],
  ];
  const WHO = { mama: 'MOTHER', tata: 'FATHER' };
  const KIND = { krus: 'KRUS', gmina: 'MUNICIPALITY' };
  return {
    source: 'js/app.js simOut(): resolvePerson() for both parents, simulate(), composed checks, zamiastZUS()',
    cases: inputs.map(([name, input]) => {
      const RM = C.resolvePerson({ t: mockupTitles(input.mother) });
      const RT = C.resolvePerson({ t: mockupTitles(input.father.titles) });
      const asIn = (R) => ({ tytul: R.tytul, podstawa: R.podstawa, debt: R.debt, krus: R.krus });
      const sim = {
        ...mockupSimulation({ ...input, mother: { mainTitle: 'NONE', base: 0, blockingDebt: 0, agriculturalInsurance: false }, father: { ...input.father, insurance: { mainTitle: 'NONE', base: 0, blockingDebt: 0, agriculturalInsurance: false } } }),
      };
      sim.mama = asIn(RM);
      sim.tata = { ...asIn(RT), ojc: input.father.paternityLeave, rodz: input.father.parentalWeeks, macPrzejecie: input.father.maternityWeeksTaken };
      sim.praca = input.work ? { kto: WHO_MOCKUP[input.work.parent], f: input.work.share, weeks: input.work.weeks } : { kto: 'none', f: 0.5, weeks: 8 };
      const r = C.simulate(sim);
      const pre = [...RM.checks.map((c) => ({ ...c, t: 'Mama: ' + c.t })), ...RT.checks.filter((c) => c.lvl !== 'ok' || RT.parts.length > 1).map((c) => ({ ...c, t: 'Tata: ' + c.t }))];
      let all = [...pre.filter((c) => !(c.lvl === 'no' && /Rolnik w KRUS|Żaden z tytułów/.test(c.t))), ...r.checks];
      const alt = C.zamiastZUS(RM, input.children);
      all = all.filter((c) => !(alt && /^Mama: (brak ubezpieczenia|ubezpieczenie w KRUS)/.test(c.t)));
      return {
        name,
        input,
        expected: {
          segments: r.segs.map((x) => ({ parent: WHO[x.who], label: x.label, weeks: x.weeks, rate: x.pct, workFactor: x.factor, from: iso(x.from), to: iso(x.to), monthlyGross: x.monthlyGross, monthlyNet: x.monthlyNet, total: x.total })),
          totals: { mother: r.totals.mama, father: r.totals.tata, family: r.totals.razem },
          checks: checks(all),
          notes: r.notes,
          alternative: alt ? { kind: KIND[alt.kind], title: alt.title, payer: alt.who, monthly: alt.monthly, weeks: alt.weeks } : null,
        },
      };
    }),
  };
};
const WHO_MOCKUP = { MOTHER: 'mama', FATHER: 'tata' };

// ---------------------------------------------------------------------------------------------------------------
// Guest guide: the survey answers go through finishOnboarding() and ctx(), then buildTimeline() and alerts() of
// js/app.js. app.js needs a browser, so these functions are cut out of its source and run here with a stubbed state
// and a fixed "today" (the same FixedDateTimeGenerator day the Java test uses).
// ---------------------------------------------------------------------------------------------------------------
const GUIDE_TODAY = '2026-11-22';
function appFunctions(names) {
  const lines = readFileSync(resolve(mockupDir, 'js', 'app.js'), 'utf8').split('\n');
  const top = /^(function |const |let |\/\*|\/\/)/;
  return names.map((name) => {
    const start = lines.findIndex((l) => l.startsWith(`function ${name}(`) || l.startsWith(`const ${name} =`));
    if (start < 0) throw new Error(`app.js: ${name} not found`);
    let end = start + 1;
    while (end < lines.length && !top.test(lines[end])) end++;
    return lines.slice(start, end).join('\n');
  }).join('\n');
}
function withToday(isoDay, run) {
  const RealDate = Date;
  const fixed = new RealDate(`${isoDay}T12:00:00`).getTime();
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [fixed])); }
    static now() { return fixed; }
  };
  try { return run(); } finally { globalThis.Date = RealDate; }
}
const D = await import(pathToFileURL(resolve(mockupDir, 'js', 'data.js')).href);
const W2 = await import(pathToFileURL(resolve(mockupDir, 'js', 'wiedza.js')).href);
const guideSource = appFunctions(['activeChild', 'ctx', 'finishOnboarding', 'buildTimeline', 'addOlder', 'alerts', 'BEN_ART', 'planHtml']);
// planHtml() returns HTML: read its rows, the leave card and the warning back into data
function planItems(html) {
  const items = [];
  const re = /<a class="(plan-row|plan-card|card tint-warn plain)" href="#\/wiedza\/a\/([^"]+)">([\s\S]*?)<\/a>/g;
  for (const [, cls, articleId, inner] of html.matchAll(re)) {
    if (cls === 'plan-row') {
      const [, icon, title, text] = inner.match(/\[icon:([^\]]+)\][\s\S]*?<b>([^<]*)<\/b><small>([^<]*)<\/small>/);
      items.push({ kind: 'BENEFIT', icon, title, text, articleId, totalWeeks: null, segments: [] });
    } else if (cls === 'plan-card') {
      const [, title] = inner.match(/^\s*<b>([^<]*)<\/b>/);
      const segments = [...inner.matchAll(/<span class="pb (\w)" style="flex:(\d+)"><em>([^<]*)<\/em><i>(\d+) tyg\. · (\d+)%<\/i><\/span>/g)]
        .map(([, k, , label, weeks, pct]) => ({ kind: { m: 'MATERNITY', u: 'SUPPLEMENTARY', r: 'PARENTAL' }[k], label, weeks: +weeks, rate: +pct / 100 }));
      const [, text] = inner.match(/<small>([\s\S]*)<\/small>\s*$/);
      items.push({ kind: 'LEAVES', icon: null, title, text, articleId, totalWeeks: segments.reduce((a, x) => a + x.weeks, 0), segments });
    } else {
      const [, title, text] = inner.match(/<b>([^<]*)<\/b><span class="small">([^<]*)<\/span>/);
      items.push({ kind: 'NOTICE', icon: null, title, text, articleId, totalWeeks: null, segments: [] });
    }
  }
  if (!items.length && html) throw new Error('planHtml: nothing recognised in ' + html);
  return items;
}
const ROLE = { MOTHER: 'mama', FATHER: 'tata', GUARDIAN: 'opiekun' };
const STAGE = { PREGNANCY: 'ciaza', CHILD: 'dziecko', ADOPTION: 'adopcja' };
const WORK = {
  EMPLOYMENT: 'uop', SELF_EMPLOYMENT: 'jdg', SELF_EMPLOYMENT_WITHOUT_SICKNESS: 'jdg_nochor', MANDATE_CONTRACT: 'zlec',
  MANDATE_CONTRACT_WITHOUT_SICKNESS: 'zlec_nochor', STARTUP_RELIEF: 'ulga', FARMER: 'krus', NOT_WORKING: 'brak',
};
const PARTNER = { SHOW_PARTNER: 'track', ONLY_ME: 'notrack', SINGLE_PARENT: 'single' };
const INSTITUTION = { ZUS: 'ZUS', PRAC: 'EMPLOYER', INFO: 'INFO' };
const ALERT_LEVEL = { danger: 'DANGER', warn: 'WARNING', info: 'INFO' };
function guide(survey) {
  const S = { profile: null, children: [], activeChild: null, tasks: {}, mode: 'normal', settings: {}, authed: false,
    account: { iban: 'PL00 0000 0000 0000 0000 0000 0000' } };
  S.onb = { a: {
    role: ROLE[survey.role], stage: STAGE[survey.stage], date: survey.date, birth2: survey.childBirthDate,
    count: String(survey.children), special: [...(survey.preterm ? ['preterm'] : []), ...(survey.zaZyciem ? ['zazyciem'] : [])],
    ptc: survey.preterm?.gestationWeek, pwg: survey.preterm?.birthWeightGrams, pdn: survey.preterm?.hospitalDays,
    work: survey.work.map((w) => WORK[w]), partner: PARTNER[survey.partner],
  } };
  const fns = new Function('C', 'K', 'WORK_OPTIONS', 'S', 'U', 'go', 'runSplash', 'makeDocs', 'save', 'icon', 'esc',
    `${guideSource}\nreturn { finishOnboarding, ctx, buildTimeline, alerts, planHtml, BEN_ART };`)(C, D.K, D.WORK_OPTIONS, S, {},
    () => {}, () => {}, () => [], () => {}, (name) => `[icon:${name}]`, (text) => text);
  fns.finishOnboarding();
  const c = fns.ctx();
  const dl = (d) => d && { type: d.type === 'before' ? 'BEFORE' : 'AFTER', raw: iso(d.raw), legal: iso(d.legal), shifted: !!d.shifted, reason: d.reason ?? null, safe: iso(d.safe) };
  return {
    stage: {
      pregnancyWeek: c.stage === 'ciaza' ? c.week : null,
      childAgeMonths: c.child.birth ? c.months : null,
      childAgeLabel: c.child.birth ? C.ageLabel(C.parseISO(c.child.birth)) : null,
    },
    alerts: fns.alerts(c).map((a) => ({ level: ALERT_LEVEL[a.lvl], icon: a.ico, title: a.t, text: a.d, href: a.h })),
    plan: planItems(fns.planHtml(c)),
    // the support-mode benefits (hiddenInNormal) are not part of the guest guide
    benefits: D.BENEFITS.filter((b) => !b.hiddenInNormal).map((b) => [b, b.eligible(c)]).filter(([, e]) => e !== 'no')
      .map(([b, e]) => ({ key: b.id, name: b.name, summary: b.short, institution: INSTITUTION[b.inst], eligibility: e === 'yes' ? 'YES' : 'MAYBE',
        articleId: fns.BEN_ART[b.id] ?? null, wizardId: b.wizard ?? null, calculator: b.calc ?? null })),
    // the card of vStart(): weeks of pregnancy, otherwise months of the child's life
    weekCard: (() => {
      const pregnancy = c.stage === 'ciaza';
      const value = pregnancy ? c.week : (c.months ?? 0);
      const card = (pregnancy ? W2.CARDS_POR.ciaza : W2.CARDS_POR.dziecko).find((k) => value >= k.from && value <= k.to);
      return card ? { period: pregnancy ? 'WEEK' : 'MONTH', articleId: card.art, title: card.title, text: card.text } : null;
    })(),
    timeline: fns.buildTimeline(c).map((i) => ({
      key: i.id, title: i.title, description: i.desc || null, lateNote: i.lateNote ?? null,
      institution: INSTITUTION[i.inst], date: iso(i.date), deadline: dl(i.dl), articleId: i.art ?? null,
      wizardId: i.wizard ?? null, calculator: i.calc ?? null, optional: !!i.soft, estimate: !!i.estimate,
      milestone: !!i.milestone, due: iso(i.due), daysLeft: i.days, status: i.status.toUpperCase(),
    })),
  };
}
areas.guestGuide = () => {
  const day = (offset) => withToday(GUIDE_TODAY, () => iso(C.addDays(C.today(), offset)));
  const survey = (o) => ({ role: 'MOTHER', stage: 'PREGNANCY', date: day(120), childBirthDate: null, children: 1, preterm: null, zaZyciem: false,
    work: ['EMPLOYMENT'], partner: 'SHOW_PARTNER', ...o });
  const inputs = [
    // personas of the prototype (debt and sick leave are profile data, not survey answers)
    ['Anna: 28th week of pregnancy, employment and a firm without sickness insurance', survey({ date: day(84), work: ['EMPLOYMENT', 'SELF_EMPLOYMENT_WITHOUT_SICKNESS'] })],
    ['Kasia: self-employed, son 16 days old', survey({ stage: 'CHILD', date: day(-16), work: ['SELF_EMPLOYMENT'] })],
    ['Ola: single mother of a premature girl', survey({ stage: 'CHILD', date: day(-42), work: ['EMPLOYMENT'], partner: 'SINGLE_PARENT', preterm: { gestationWeek: 27, birthWeightGrams: 950, hospitalDays: 49 } })],
    ['Marek: father, daughter 10.5 months old', survey({ role: 'FATHER', stage: 'CHILD', date: day(-330) })],
    ['Ewa: foster family, child taken in 5 days ago', survey({ role: 'GUARDIAN', stage: 'ADOPTION', date: day(-5), childBirthDate: day(-760) })],
    ['Zofia: daughter 14 months old', survey({ stage: 'CHILD', date: day(-425) })],
    ['Zofia: second pregnancy', survey({ date: day(150) })],
    // other answers
    ['self-employed mother in pregnancy', survey({ work: ['SELF_EMPLOYMENT'] })],
    ['mother on a mandate contract in pregnancy', survey({ work: ['MANDATE_CONTRACT'], date: day(30) })],
    ['mother without sickness insurance in pregnancy', survey({ work: ['NOT_WORKING'] })],
    ['mother on startup relief', survey({ work: ['STARTUP_RELIEF'] })],
    ['farmer mother after birth', survey({ stage: 'CHILD', date: day(-20), work: ['FARMER'] })],
    ['mandate contract without sickness insurance', survey({ stage: 'CHILD', date: day(-3), work: ['MANDATE_CONTRACT_WITHOUT_SICKNESS'] })],
    ['father in pregnancy', survey({ role: 'FATHER' })],
    ['mother of twins, 81.5% deadline missed', survey({ stage: 'CHILD', date: day(-40), children: 2 })],
    ['triplets born today, partner hidden', survey({ stage: 'CHILD', date: day(0), children: 3, partner: 'ONLY_ME' })],
    ['self-employed mother, child 1 year old', survey({ stage: 'CHILD', date: day(-365), work: ['SELF_EMPLOYMENT'] })],
    ['employment and self-employment, child 19 days old', survey({ stage: 'CHILD', date: '2026-11-03', work: ['EMPLOYMENT', 'SELF_EMPLOYMENT'] })],
    ['child 3 years old', survey({ stage: 'CHILD', date: day(-1100) })],
    ['adoption without sickness insurance', survey({ role: 'GUARDIAN', stage: 'ADOPTION', date: day(-30), childBirthDate: day(-400), work: ['NOT_WORKING'] })],
    ['father without sickness insurance, child 2 months old', survey({ role: 'FATHER', stage: 'CHILD', date: day(-60), work: ['NOT_WORKING'] })],
    ['premature baby, mother on a mandate contract', survey({ stage: 'CHILD', date: day(-10), work: ['MANDATE_CONTRACT'], preterm: { gestationWeek: 33, birthWeightGrams: 1900, hospitalDays: 12 } })],
    ['"Za zyciem" twins, father', survey({ role: 'FATHER', stage: 'CHILD', date: day(-100), children: 2, zaZyciem: true })],
    ['child taken in at 13.9 years', survey({ role: 'GUARDIAN', stage: 'ADOPTION', date: day(-2), childBirthDate: day(-5079) })],
    ['child taken in over the age limit', survey({ role: 'GUARDIAN', stage: 'ADOPTION', date: day(-2), childBirthDate: day(-5500) })],
    ['child 7 years old', survey({ stage: 'CHILD', date: day(-2600) })],
    ['child 15 years old', survey({ stage: 'CHILD', date: day(-5500) })],
  ];
  return {
    source: `js/app.js finishOnboarding(), ctx(), buildTimeline(), alerts(), planHtml(), BENEFITS eligible() and the week card of vStart() with today = ${GUIDE_TODAY}`,
    cases: inputs.map(([name, input]) => ({ name, input, expected: withToday(GUIDE_TODAY, () => guide(input)) })),
  };
};

mkdirSync(outDir, { recursive: true });
for (const [area, build] of Object.entries(areas)) {
  const file = join(outDir, `${area}.json`);
  writeFileSync(file, JSON.stringify(build(), null, 2) + '\n');
  console.log(`${area}: ${file}`);
}
