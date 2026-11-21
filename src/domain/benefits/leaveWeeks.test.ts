import { maternityLeaveWeeks } from './leaveWeeks';

describe('maternityLeaveWeeks', () => {
  it.each([
    [1, 20],
    [2, 31],
    [3, 33],
    [4, 35],
    [5, 37],
    [8, 37],
  ])('%i dzieci → %i tygodni', (children, weeks) => {
    expect(maternityLeaveWeeks(children)).toBe(weeks);
  });

  it('domyślnie liczy dla jednego dziecka, a wartości < 1 traktuje jak 1', () => {
    expect(maternityLeaveWeeks()).toBe(20);
    expect(maternityLeaveWeeks(0)).toBe(20);
  });
});
