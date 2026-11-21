import { getInsuranceFlags } from './insuranceFlags';

describe('getInsuranceFlags', () => {
  it('etat + firma: oba tytuły i prawo do zasiłków', () => {
    expect(getInsuranceFlags(['uop', 'jdg'])).toEqual({
      hasEmploymentContract: true,
      hasBusiness: true,
      hasCivilContract: false,
      hasSicknessInsurance: true,
    });
  });

  it('samo zlecenie daje prawo do zasiłków', () => {
    expect(getInsuranceFlags(['zlec']).hasSicknessInsurance).toBe(true);
  });

  it('brak ubezpieczenia = brak prawa do zasiłków', () => {
    expect(getInsuranceFlags(['brak']).hasSicknessInsurance).toBe(false);
    expect(getInsuranceFlags([]).hasSicknessInsurance).toBe(false);
  });
});
