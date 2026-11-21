import { darkColors, lightColors } from './colors';
import { palette } from './palette';

describe('colors', () => {
  it('oba motywy mają ten sam zestaw kluczy', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });

  it('kolor główny to zieleń z prototypu ZUS baby w obu motywach', () => {
    expect(lightColors.primary).toBe(palette.green);
    expect(darkColors.primary).toBe(palette.green);
  });

  it('ciemny motyw ma tło „night” z prototypu', () => {
    expect(darkColors.background).toBe(palette.night);
  });
});
