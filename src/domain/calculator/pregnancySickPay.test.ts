import { pregnancySickPay } from './pregnancySickPay';

const employee = { title: 'uop' as const, base: 6000, days: 60 };

describe('pregnancySickPay', () => {
  it('etat: 33 dni wynagrodzenia od pracodawcy, potem zasiłek — razem 100% podstawy', () => {
    const result = pregnancySickPay(employee);
    expect(result.parts.map((p) => p.days)).toEqual([33, 27]);
    expect(result.daily).toBe(200);
    expect(result.total).toBe(12000);
  });

  it('50+ lat albo dni już wykorzystane w roku — pracodawca płaci krócej', () => {
    expect(pregnancySickPay({ ...employee, age50: true }).parts[0].days).toBe(14);
    expect(pregnancySickPay({ ...employee, usedDays: 30 }).parts[0].days).toBe(3);
    expect(pregnancySickPay({ ...employee, usedDays: 40 }).parts.map((p) => p.days)).toEqual([60]);
  });

  it('zlecenie i firma — zasiłek od 1. dnia', () => {
    const result = pregnancySickPay({ title: 'jdg', base: 6000, days: 30 });
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0].label).toMatch(/od 1\. dnia/);
  });

  it('ponad 270 dni — świadczenie rehabilitacyjne', () => {
    const result = pregnancySickPay({ title: 'jdg', base: 3000, days: 300 });
    expect(result.parts.map((p) => p.days)).toEqual([270, 30]);
    expect(result.parts[1].label).toMatch(/rehabilitacyjne/);
  });

  it('okres wyczekiwania: 30 dni na etacie, 90 przy dobrowolnym', () => {
    expect(pregnancySickPay({ ...employee, insuredDays: 20 }).checks[0]).toMatchObject({ level: 'no' });
    expect(pregnancySickPay({ title: 'zlec', base: 3000, days: 30, insuredDays: 60 }).checks[0].text).toMatch(/90 dniach/);
    expect(pregnancySickPay({ ...employee, insuredDays: 30 }).checks[0]).toMatchObject({ level: 'ok' });
  });

  it('firma z zaległością — ostrzeżenie o wstrzymaniu', () => {
    const result = pregnancySickPay({ title: 'jdg', base: 5000, days: 30, debt: 100 });
    expect(result.checks.some((c) => c.level === 'no' && /wstrzymany/.test(c.text))).toBe(true);
  });

  it('bez ubezpieczenia — nie przysługuje', () => {
    expect(pregnancySickPay({ title: 'none', base: 0, days: 30 })).toMatchObject({ parts: [], total: 0 });
  });
});
