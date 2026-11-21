import type { PersonTitles } from './PersonTitles';
import { resolvePerson } from './resolvePerson';

const uop = (base: number, atLeastMinWage = true): PersonTitles['uop'] => ({ on: true, base, atLeastMinWage });
const zlec = (base: number, extra: Partial<NonNullable<PersonTitles['zlec']>> = {}): PersonTitles['zlec'] => ({
  on: true,
  base,
  voluntarySickness: true,
  student: false,
  ...extra,
});
const jdg = (base: number, extra: Partial<NonNullable<PersonTitles['jdg']>> = {}): PersonTitles['jdg'] => ({
  on: true,
  base,
  voluntarySickness: true,
  startRelief: false,
  debt: 0,
  ...extra,
});
const texts = (titles: PersonTitles) => resolvePerson(titles).checks.map((c) => c.text).join('\n');

describe('resolvePerson', () => {
  it('bez żadnego tytułu — brak ubezpieczenia', () => {
    expect(resolvePerson({})).toMatchObject({ title: 'none', base: 0, parts: [] });
  });

  it('sam KRUS — zasiłek z KRUS, nie z ZUS', () => {
    const result = resolvePerson({ krus: { on: true } });
    expect(result).toMatchObject({ title: 'none', krus: true });
    expect(result.checks[0]).toMatchObject({ level: 'no' });
  });

  describe('etat', () => {
    it('podstawa z etatu', () => {
      expect(resolvePerson({ uop: uop(6000) })).toMatchObject({ title: 'uop', base: 6000 });
    });

    it('pełny etat poniżej minimum — podstawa podniesiona do 4 147,10 zł', () => {
      const result = resolvePerson({ uop: uop(3000) });
      expect(result.base).toBe(4147.1);
      expect(result.checks[0].text).toMatch(/podniesiona do minimum/);
    });

    it('etat poniżej płacy minimalnej (część etatu) — bez podnoszenia', () => {
      expect(resolvePerson({ uop: uop(2000, false) }).base).toBe(2000);
    });
  });

  describe('zbieg tytułów', () => {
    it('etat z płacą minimalną + zlecenie/firma — zasiłek tylko z etatu', () => {
      const titles = { uop: uop(6000), zlec: zlec(3000), jdg: jdg(5000) };
      expect(resolvePerson(titles)).toMatchObject({ title: 'uop', base: 6000, parts: [{ title: 'uop' }] });
      expect(texts(titles)).toMatch(/zasiłek tylko z etatu/);
    });

    it('etat poniżej płacy minimalnej + zlecenie z chorobowym — dwa tytuły, podstawy się sumują', () => {
      const result = resolvePerson({ uop: uop(2000, false), zlec: zlec(1500) });
      expect(result.parts).toHaveLength(2);
      expect(result.base).toBe(3500);
      expect(result.checks.at(-1)).toMatchObject({ level: 'ok' });
    });

    it('zlecenie z płacą minimalną + firma — chorobowe tylko ze zlecenia', () => {
      const result = resolvePerson({ zlec: zlec(4500), jdg: jdg(5000) });
      expect(result).toMatchObject({ title: 'zlec', base: 4500 });
    });

    it('zlecenie poniżej płacy minimalnej + firma — chorobowe tylko z firmy', () => {
      const result = resolvePerson({ zlec: zlec(1000), jdg: jdg(5000) });
      expect(result).toMatchObject({ title: 'jdg', base: 5000 });
    });
  });

  describe('zlecenie i firma — wyjątki', () => {
    it('student na zleceniu — bez ubezpieczenia', () => {
      expect(resolvePerson({ zlec: zlec(3000, { student: true }) }).title).toBe('none');
    });

    it('ulga na start — bez ubezpieczenia', () => {
      expect(resolvePerson({ jdg: jdg(5000, { startRelief: true }) }).title).toBe('none');
    });

    it('bez dobrowolnego chorobowego — bez zasiłku', () => {
      const titles = { jdg: jdg(5000, { voluntarySickness: false }) };
      expect(resolvePerson(titles).title).toBe('none');
      expect(texts(titles)).toMatch(/Firma: bez dobrowolnego chorobowego/);
    });

    it('podstawa ponad limit dobrowolnego chorobowego — przycięta', () => {
      expect(resolvePerson({ jdg: jdg(30000) }).base).toBe(20321.3);
    });

    it('firma z zaległością ponad 1% płacy minimalnej — zasiłek wstrzymany', () => {
      const result = resolvePerson({ jdg: jdg(5000, { debt: 200 }) });
      expect(result).toMatchObject({ title: 'jdg', base: 0, parts: [], debt: 200 });
    });
  });

  it('tytuł bez wpisanej podstawy — prośba o podstawę', () => {
    expect(texts({ uop: uop(0) })).toMatch(/Wpisz podstawę/);
  });
});
