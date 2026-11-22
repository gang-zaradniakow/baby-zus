import { day } from '@/testing/dates';

import { holidayName, holidaysInYear } from './holidays';

describe('holidays', () => {
  it.each([
    [day(2026, 4, 5), 'Wielkanoc'],
    [day(2026, 4, 6), 'Poniedziałek Wielkanocny'],
    [day(2026, 6, 4), 'Boże Ciało'],
    [day(2027, 3, 28), 'Wielkanoc'],
    [day(2026, 11, 11), 'Narodowe Święto Niepodległości'],
  ])('rozpoznaje %s jako „%s”', (date, name) => {
    expect(holidayName(date)).toBe(name);
  });

  it('Wigilia jest dniem wolnym od 2025 r.', () => {
    expect(holidayName(day(2025, 12, 24))).toBe('Wigilia (od 2025 r.)');
    expect(holidayName(day(2024, 12, 24))).toBeNull();
  });

  it('zwykły dzień nie jest świętem', () => {
    expect(holidayName(day(2026, 11, 20))).toBeNull();
  });

  it('lista świąt jest posortowana i ma 14 dni od 2025 r.', () => {
    const list = holidaysInYear(2026);
    expect(list).toHaveLength(14);
    const times = list.map((h) => h.date.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});
