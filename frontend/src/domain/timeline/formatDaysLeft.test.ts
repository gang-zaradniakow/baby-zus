import { formatDaysLeft } from './formatDaysLeft';

describe('formatDaysLeft', () => {
  it.each([
    [0, 'dziś'],
    [1, 'jutro'],
    [5, 'za 5 dni'],
    [-1, 'wczoraj'],
    [-3, '3 dni temu'],
  ])('%i → „%s”', (days, text) => {
    expect(formatDaysLeft(days)).toBe(text);
  });
});
