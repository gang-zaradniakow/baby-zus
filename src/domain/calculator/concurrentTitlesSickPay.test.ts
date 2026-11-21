import { concurrentTitlesSickPay } from './concurrentTitlesSickPay';
import { resolvePerson } from './resolvePerson';

describe('concurrentTitlesSickPay', () => {
  it('dwa tytuły — każdy liczony osobno, kwoty się sumują, etykiety z nazwą tytułu', () => {
    const person = resolvePerson({
      uop: { on: true, base: 2000, atLeastMinWage: false },
      zlec: { on: true, base: 1500, voluntarySickness: true, student: false },
    });
    const result = concurrentTitlesSickPay(person, { days: 30 });

    expect(result.total).toBe(2000 + 1500);
    expect(result.parts.map((p) => p.label)).toEqual([
      'etat — Wynagrodzenie chorobowe (płaci pracodawca)',
      'zlecenie — Zasiłek chorobowy (od 1. dnia — ZUS lub płatnik)',
    ]);
  });

  it('jeden tytuł — bez przedrostków', () => {
    const person = resolvePerson({ jdg: { on: true, base: 3000, voluntarySickness: true, startRelief: false, debt: 0 } });
    expect(concurrentTitlesSickPay(person, { days: 30 }).parts[0].label).not.toMatch(/—.*—/);
  });

  it('bez ubezpieczenia — zero i wyjaśnienie', () => {
    const result = concurrentTitlesSickPay(resolvePerson({}), { days: 30 });
    expect(result.total).toBe(0);
    expect(result.checks.some((c) => c.level === 'no')).toBe(true);
  });
});
