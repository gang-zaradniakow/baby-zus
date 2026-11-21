import { formatPercent } from './formatPercent';

describe('formatPercent', () => {
  it('przecinek dziesiętny, bez zbędnych zer', () => {
    expect(formatPercent(0.815)).toBe('81,5%');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(0.7)).toBe('70%');
    expect(formatPercent(0.35)).toBe('35%');
  });
});
