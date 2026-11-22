import { makeProfile } from '@/testing/profiles';

import { personalizeAnswer } from './personalizeAnswer';

describe('personalizeAnswer', () => {
  it('bez profilu albo bez reguły — nic', () => {
    expect(personalizeAnswer('mac-gdzie', null)).toBeNull();
    expect(personalizeAnswer('l4-kody', makeProfile())).toBeNull();
  });

  it('sama firma — wniosek ZAM prosto do ZUS', () => {
    expect(personalizeAnswer('mac-gdzie', makeProfile({ employment: ['jdg'] }))).toMatch(/wniosek ZAM/);
  });

  it('etat — kto wypłaca zasiłek wg wielkości płatnika', () => {
    expect(personalizeAnswer('l4-kto', makeProfile({ payerSize: 'maly' }))).toMatch(/do 20 osób/);
    expect(personalizeAnswer('l4-kto', makeProfile({ payerSize: 'duzy' }))).toMatch(/ponad 20 osób/);
  });

  it('zaległość ponad próg — podpowiedź o spłacie', () => {
    expect(personalizeAnswer('jdg-dlug', makeProfile({ employment: ['jdg'] }), 62.4)).toMatch(/62,40/);
    expect(personalizeAnswer('jdg-dlug', makeProfile({ employment: ['jdg'] }), 10)).toBeNull();
  });

  it('urlop ojcowski do 1. urodzin i termin 21 dni dla mamy', () => {
    const profile = makeProfile({ eventDate: '2026-11-01' });
    expect(personalizeAnswer('ojcowski', profile)).toMatch(/01\.11\.2027/);
    // 1.11.2026 + 21 dni = 22.11.2026 (niedziela) → następny dzień roboczy 23.11.2026.
    expect(personalizeAnswer('mac-21', profile)).toMatch(/23\.11\.2026/);
    expect(personalizeAnswer('mac-21', makeProfile({ role: 'tata', eventDate: '2026-11-01' }))).toBeNull();
  });
});
