import { day } from '@/testing/dates';

import { verifyCase, type CaseInput } from './verifyCase';

const base: CaseInput = {
  kind: 'maternity',
  title: 'uop',
  insuredFrom: day(2024, 1, 1),
  insuredTo: null,
  eventDate: day(2026, 11, 21),
  debt: 0,
  largePayer: true,
};
const texts = (input: Partial<CaseInput>) => verifyCase({ ...base, ...input }).checks.map((c) => c.text).join('\n');

describe('verifyCase', () => {
  it('ubezpieczona pracownica, duży płatnik — przysługuje, wypłaca pracodawca', () => {
    const result = verifyCase(base);
    expect(result).toMatchObject({ insured: true, eligible: true });
    expect(texts({})).toMatch(/Pracodawca — sam ustala i wypłaca/);
  });

  it('ubezpieczenie skończyło się przed porodem — nie przysługuje, z wyjątkami art. 30', () => {
    const result = verifyCase({ ...base, insuredTo: day(2026, 10, 31) });
    expect(result).toMatchObject({ insured: false, eligible: false });
    expect(result.checks[0].text).toMatch(/art\. 30/);
  });

  it('brak tytułu ubezpieczenia — nie przysługuje, bez informacji o płatniku', () => {
    expect(verifyCase({ ...base, title: 'none' }).eligible).toBe(false);
    expect(texts({ title: 'none' })).not.toMatch(/Kto wypłaca/);
  });

  it('L4: okres wyczekiwania 30 dni na etacie, 90 przy dobrowolnym', () => {
    const sick = { kind: 'sickness' as const, insuredFrom: day(2026, 11, 1), eventDate: day(2026, 11, 21) };
    expect(texts({ ...sick })).toMatch(/niespełniony: 20 z 30 dni — zasiłek przysługuje dopiero od 01\.12\.2026/);
    expect(texts({ ...sick, title: 'zlec', insuredFrom: day(2026, 9, 1) })).toMatch(/81 z 90 dni/);
    expect(texts({ ...sick, insuredFrom: day(2026, 10, 1) })).toMatch(/Okres wyczekiwania 30 dni spełniony \(51 dni\)/);
  });

  it('firma: zaległość ponad próg wstrzymuje; wniosek ZAS-53 / ZAM do ZUS', () => {
    expect(verifyCase({ ...base, title: 'jdg', debt: 62.4 }).eligible).toBe(false);
    expect(texts({ title: 'jdg' })).toMatch(/ZAM bezpośrednio do ZUS/);
    expect(texts({ title: 'jdg', kind: 'sickness' })).toMatch(/ZAS-53/);
  });

  it('mały płatnik — wypłaca ZUS (Z-3 / Z-3a)', () => {
    expect(texts({ largePayer: false })).toMatch(/przekazuje wniosek i Z-3\./);
    expect(texts({ largePayer: false, title: 'zlec' })).toMatch(/Z-3a/);
  });
});
