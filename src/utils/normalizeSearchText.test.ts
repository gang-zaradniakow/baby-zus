import { normalizeSearchText } from './normalizeSearchText';

describe('normalizeSearchText', () => {
  it('usuwa polskie znaki i wielkie litery', () => {
    expect(normalizeSearchText('Zasiłek Macierzyński ŻÓŁĆ')).toBe('zasilek macierzynski zolc');
  });

  it('usuwa znaczniki pogrubienia i interpunkcję, zostawia procenty', () => {
    expect(normalizeSearchText('**81,5%** — wariant (uśredniony)!')).toBe('81,5% wariant usredniony');
  });

  it('zostawia łącznik w kodach druków', () => {
    expect(normalizeSearchText('Zaświadczenie Z-3a')).toBe('zaswiadczenie z-3a');
  });

  it('skraca wiele spacji do jednej', () => {
    expect(normalizeSearchText('  kod   B  ')).toBe('kod b');
  });
});
