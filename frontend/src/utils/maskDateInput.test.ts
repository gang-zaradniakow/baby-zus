import { maskDateInput } from './maskDateInput';

describe('maskDateInput', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['12', '12'],
    ['120', '12.0'],
    ['1203', '12.03'],
    ['12032', '12.03.2'],
    ['12032027', '12.03.2027'],
  ])('„%s” → „%s”', (raw, masked) => {
    expect(maskDateInput(raw)).toBe(masked);
  });

  it('usuwa znaki inne niż cyfry (także wpisane kropki)', () => {
    expect(maskDateInput('12.03.2027')).toBe('12.03.2027');
    expect(maskDateInput('1a2b')).toBe('12');
  });

  it('ucina nadmiarowe cyfry', () => {
    expect(maskDateInput('1203202799')).toBe('12.03.2027');
  });
});
