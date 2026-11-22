import { resolveBenefitPayer } from './resolveBenefitPayer';

describe('resolveBenefitPayer', () => {
  it('duży płatnik albo „nie wiem” — pracodawca', () => {
    expect(resolveBenefitPayer({ employment: ['uop'], payerSize: 'duzy' })).toBe('PRAC');
    expect(resolveBenefitPayer({ employment: ['uop'], payerSize: 'niewiem' })).toBe('PRAC');
    expect(resolveBenefitPayer({ employment: ['zlec'] })).toBe('PRAC');
  });

  it('płatnik do 20 osób — ZUS', () => {
    expect(resolveBenefitPayer({ employment: ['uop'], payerSize: 'maly' })).toBe('ZUS');
  });

  it('sama firma — ZUS', () => {
    expect(resolveBenefitPayer({ employment: ['jdg'] })).toBe('ZUS');
  });
});
