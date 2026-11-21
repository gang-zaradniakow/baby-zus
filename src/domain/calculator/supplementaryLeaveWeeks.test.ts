import { supplementaryLeaveWeeks } from './supplementaryLeaveWeeks';

describe('supplementaryLeaveWeeks', () => {
  it('przed 28. tygodniem: tydzień za rozpoczęty tydzień w szpitalu, do 15 tyg.', () => {
    expect(supplementaryLeaveWeeks({ gestationWeek: 26, birthWeightGrams: 900, hospitalDays: 30 })).toMatchObject({
      weeks: 5,
      limit: 15,
    });
    expect(supplementaryLeaveWeeks({ gestationWeek: 25, birthWeightGrams: 800, hospitalDays: 200 }).weeks).toBe(15);
  });

  it('masa ≤ 1000 g też daje limit 15 tyg., nawet po 28. tygodniu', () => {
    expect(supplementaryLeaveWeeks({ gestationWeek: 30, birthWeightGrams: 1000, hospitalDays: 7 }).limit).toBe(15);
  });

  it('28.–37. tydzień: limit 8 tyg.', () => {
    expect(supplementaryLeaveWeeks({ gestationWeek: 32, birthWeightGrams: 1800, hospitalDays: 21 })).toMatchObject({
      weeks: 3,
      limit: 8,
    });
    expect(supplementaryLeaveWeeks({ gestationWeek: 34, birthWeightGrams: 2200, hospitalDays: 90 }).weeks).toBe(8);
  });

  it('po 37. tygodniu: tylko przy pobycie min. 2 dni od 5. do 28. dnia po porodzie', () => {
    expect(
      supplementaryLeaveWeeks({ gestationWeek: 39, birthWeightGrams: 3400, hospitalDays: 10, stayStartDay: 6 }).weeks,
    ).toBe(2);
    expect(
      supplementaryLeaveWeeks({ gestationWeek: 39, birthWeightGrams: 3400, hospitalDays: 10, stayStartDay: 2 }).weeks,
    ).toBe(0);
    expect(supplementaryLeaveWeeks({ gestationWeek: 39, birthWeightGrams: 3400, hospitalDays: 1 }).weeks).toBe(0);
  });
});
