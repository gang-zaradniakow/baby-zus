import { stemSearchWord } from './stemSearchWord';

describe('stemSearchWord', () => {
  it('z długich słów ucina dwie ostatnie litery', () => {
    expect(stemSearchWord('zasilek')).toBe('zasil');
    expect(stemSearchWord('macierzynski')).toBe('macierzyns');
  });

  it('z pięcioliterowych ucina jedną', () => {
    expect(stemSearchWord('ciaza')).toBe('ciaz');
  });

  it('krótkie słowa zostawia', () => {
    expect(stemSearchWord('kod')).toBe('kod');
    expect(stemSearchWord('z')).toBe('z');
  });
});
