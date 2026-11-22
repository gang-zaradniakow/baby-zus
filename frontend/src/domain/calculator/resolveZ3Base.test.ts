import { resolveZ3Base } from './resolveZ3Base';

const months = (...amounts: number[]) => amounts.map((amount) => ({ amount, skip: false }));

describe('resolveZ3Base', () => {
  it('średnia z miesięcy minus 13,71% składek', () => {
    const result = resolveZ3Base(months(6000, 6000, 9000));
    expect(result.average).toBe(7000);
    expect(result.base).toBeCloseTo(6040.3, 1);
    expect(result.monthsUsed).toBe(3);
  });

  it('pomija miesiące oznaczone „pomiń” i puste', () => {
    const result = resolveZ3Base([
      { amount: 6000, skip: false },
      { amount: 1000, skip: true },
      { amount: 0, skip: false },
    ]);
    expect(result).toMatchObject({ average: 6000, monthsUsed: 1 });
  });

  it('pełny etat poniżej minimum — minimalna podstawa', () => {
    const result = resolveZ3Base(months(3000));
    expect(result.base).toBe(4147.1);
    expect(result.note).toMatch(/minimalną podstawę/);
  });

  it('dobrowolne chorobowe ponad limit — limit podstawy', () => {
    expect(resolveZ3Base(months(40000), 'jdg').base).toBe(20321.3);
  });

  it('bez miesięcy — prośba o dane', () => {
    expect(resolveZ3Base([])).toMatchObject({ base: 0, note: 'Wpisz co najmniej jeden miesiąc.' });
  });
});
