import { parseDecimal } from './parseDecimal';

describe('parseDecimal', () => {
  it('przecinek dziesiętny i spacje tysięcy', () => {
    expect(parseDecimal('4 147,10')).toBe(4147.1);
    expect(parseDecimal('6000')).toBe(6000);
    expect(parseDecimal('12.5')).toBe(12.5);
  });

  it('pusty lub niepoprawny tekst — 0', () => {
    expect(parseDecimal('')).toBe(0);
    expect(parseDecimal('abc')).toBe(0);
  });
});
