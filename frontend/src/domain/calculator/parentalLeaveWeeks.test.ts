import { LEGAL_PARAMS } from '@/data/legalParams';

import { parentalLeaveWeeks } from './parentalLeaveWeeks';

describe('parentalLeaveWeeks', () => {
  it('jedno dziecko 41 tyg., więcej dzieci 43 tyg.', () => {
    expect(parentalLeaveWeeks(1)).toBe(41);
    expect(parentalLeaveWeeks(2)).toBe(43);
    expect(parentalLeaveWeeks(5)).toBe(43);
  });

  it('„Za życiem” — 65 / 67 tyg.', () => {
    expect(parentalLeaveWeeks(1, true)).toBe(65);
    expect(parentalLeaveWeeks(3, true)).toBe(67);
  });

  it('korzysta z przekazanych parametrów (np. po zmianie w panelu)', () => {
    const changed = { ...LEGAL_PARAMS, parentalWeeks: { ...LEGAL_PARAMS.parentalWeeks, single: 45 } };
    expect(parentalLeaveWeeks(1, false, changed)).toBe(45);
  });
});
