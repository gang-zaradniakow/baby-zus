import { adoptionLeaveWeeks } from './adoptionLeaveWeeks';

const base = { childrenCount: 1, zaZyciem: false, kind: 'adoption' as const, childAgeYears: 2 };

describe('adoptionLeaveWeeks', () => {
  it('małe dziecko — pełny wymiar 20 + 41 tyg.', () => {
    expect(adoptionLeaveWeeks(base)).toMatchObject({ maternity: 20, parental: 41, ageLimit: 14 });
  });

  it('adopcja: limit 14 lat; rodzina zastępcza: 7 lat, przy odroczonej szkole 10 lat', () => {
    expect(adoptionLeaveWeeks({ ...base, kind: 'foster' }).ageLimit).toBe(7);
    expect(adoptionLeaveWeeks({ ...base, kind: 'foster', deferredSchool: true }).ageLimit).toBe(10);
  });

  it('dziecko blisko limitu — urlop do limitu, ale min. 9 tyg., rodzicielski skrócony do 38', () => {
    const nearLimit = adoptionLeaveWeeks({ ...base, childAgeYears: 13.9 });
    expect(nearLimit.maternity).toBe(9);
    expect(nearLimit.parental).toBe(38);

    const fewMonthsLeft = adoptionLeaveWeeks({ ...base, childAgeYears: 13.75 });
    expect(fewMonthsLeft.maternity).toBe(13);
  });

  it('„Za życiem” przy skróconym wymiarze — rodzicielski 62 tyg.', () => {
    expect(adoptionLeaveWeeks({ ...base, zaZyciem: true, childAgeYears: 13.9 }).parental).toBe(62);
  });

  it('dziecko po limicie wieku — urlop nie przysługuje', () => {
    const result = adoptionLeaveWeeks({ ...base, kind: 'foster', childAgeYears: 8 });
    expect(result).toMatchObject({ maternity: 0, parental: 0 });
    expect(result.note).toMatch(/nie przysługuje/);
  });
});
