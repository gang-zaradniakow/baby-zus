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

mkdirSync(outDir, { recursive: true });
for (const [area, build] of Object.entries(areas)) {
  const file = join(outDir, `${area}.json`);
  writeFileSync(file, JSON.stringify(build(), null, 2) + '\n');
  console.log(`${area}: ${file}`);
}
