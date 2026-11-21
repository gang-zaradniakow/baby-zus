import { formatMoney } from './formatMoney';

/** Niełamliwa spacja — w testach zamieniamy na zwykłą, żeby było czytelniej. */
const plain = (text: string) => text.replace(/ /g, ' ');

describe('formatMoney', () => {
  it('grosze po przecinku, tysiące oddzielone spacją', () => {
    expect(plain(formatMoney(4147.1))).toBe('4 147,10 zł');
    expect(plain(formatMoney(20321.3))).toBe('20 321,30 zł');
  });

  it('bez groszy — zaokrągla do złotówek', () => {
    expect(plain(formatMoney(1000, 0))).toBe('1 000 zł');
    expect(plain(formatMoney(3599.6, 0))).toBe('3 600 zł');
  });

  it('małe kwoty i miliony', () => {
    expect(plain(formatMoney(48.06))).toBe('48,06 zł');
    expect(plain(formatMoney(1234567, 0))).toBe('1 234 567 zł');
  });
});
