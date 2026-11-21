import { makeProfile } from '@/testing/profiles';

import { buildZusAccount } from './buildZusAccount';

describe('buildZusAccount', () => {
  it('etat — chorobowe obowiązkowe, płatnik wg wielkości firmy', () => {
    const big = buildZusAccount(makeProfile({ employment: ['uop'], payerSize: 'duzy' }));
    const small = buildZusAccount(makeProfile({ employment: ['uop'], payerSize: 'maly' }));

    expect(big.titles[0]).toMatchObject({ name: 'Umowa o pracę', sickness: 'mandatory', contributionBase: 6500 });
    expect(big.titles[0].payer).toMatch(/ponad 20/);
    expect(small.titles[0].payer).toMatch(/zasiłki wypłaca ZUS/);
    expect(big.hasSicknessInsurance).toBe(true);
  });

  it('firma obok etatu — tylko zdrowotne; sama firma — dobrowolne chorobowe', () => {
    const both = buildZusAccount(makeProfile({ employment: ['uop', 'jdg'] }));
    const business = buildZusAccount(makeProfile({ employment: ['jdg'] }));

    expect(both.titles[1]).toMatchObject({ sickness: 'none', contributionBase: 0 });
    expect(business.titles[0]).toMatchObject({ sickness: 'voluntary', contributionBase: 5652 });
  });

  it('bez pracy — brak tytułów i brak chorobowego', () => {
    const account = buildZusAccount(makeProfile({ employment: ['brak'] }));
    expect(account).toMatchObject({ titles: [], hasSicknessInsurance: false });
  });

  it('dane przykładowej osoby: podstawa, zaległość i e-ZLA', () => {
    const account = buildZusAccount(makeProfile({ employment: ['jdg'] }), {
      contributionBase: 5000,
      debt: 62.4,
      certificates: [],
    });
    expect(account).toMatchObject({ debt: 62.4 });
    expect(account.titles[0].contributionBase).toBe(5000);
  });
});
