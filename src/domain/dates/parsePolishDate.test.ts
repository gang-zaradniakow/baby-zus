import { formatDate } from './formatDate';
import { parsePolishDate } from './parsePolishDate';

describe('parsePolishDate', () => {
  it('parsuje poprawną datę DD.MM.RRRR', () => {
    const result = parsePolishDate('15.03.2027');
    expect(result).not.toBeNull();
    expect(formatDate(result!)).toBe('15.03.2027');
  });

  it('akceptuje 29 lutego w roku przestępnym', () => {
    expect(parsePolishDate('29.02.2028')).not.toBeNull();
  });

  it.each(['31.02.2026', '29.02.2027', '00.01.2026', '12.13.2026'])('odrzuca nieistniejącą datę %s', (text) => {
    expect(parsePolishDate(text)).toBeNull();
  });

  it.each(['', '1.3.2027', '15-03-2027', '15.03.27', 'abc'])('odrzuca zły format „%s”', (text) => {
    expect(parsePolishDate(text)).toBeNull();
  });
});
