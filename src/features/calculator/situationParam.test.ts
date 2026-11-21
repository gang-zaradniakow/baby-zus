import { calculatorHref, situationFromParam } from './situationParam';

describe('situationParam', () => {
  it('polski parametr adresu → sytuacja kalkulatora', () => {
    expect(situationFromParam('ciaza')).toBe('pregnancy');
    expect(situationFromParam(['adopcja'])).toBe('adoption');
    expect(situationFromParam('cos')).toBeUndefined();
    expect(situationFromParam(undefined)).toBeUndefined();
  });

  it('wariant z artykułu → adres kalkulatora', () => {
    expect(calculatorHref('birth')).toBe('/kalkulator?sytuacja=porod');
    expect(situationFromParam(calculatorHref('adopt').split('=')[1])).toBe('adoption');
  });
});
