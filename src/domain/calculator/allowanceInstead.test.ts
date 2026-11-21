import { allowanceInstead } from './allowanceInstead';
import { resolvePerson } from './resolvePerson';

describe('allowanceInstead', () => {
  it('ubezpieczona osoba — zasiłek z ZUS, bez świadczenia zastępczego', () => {
    expect(allowanceInstead(resolvePerson({ uop: { on: true, base: 6000, atLeastMinWage: true } }))).toBeNull();
  });

  it('bez ubezpieczenia — świadczenie rodzicielskie z gminy, 1000 zł przez 52 tyg.', () => {
    expect(allowanceInstead(resolvePerson({}))).toMatchObject({ kind: 'municipal', monthly: 1000, weeks: 52 });
  });

  it('bliźnięta — 65 tyg.; rolnik — z KRUS', () => {
    expect(allowanceInstead(resolvePerson({}), 2)?.weeks).toBe(65);
    expect(allowanceInstead(resolvePerson({ krus: { on: true } }))?.kind).toBe('krus');
  });
});
