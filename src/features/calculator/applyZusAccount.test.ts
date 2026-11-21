import { buildZusAccount } from '@/domain/zus/buildZusAccount';
import { makeProfile } from '@/testing/profiles';

import { applyZusAccount } from './applyZusAccount';
import { createPersonForm } from './personForm';

describe('applyZusAccount', () => {
  it('etat: podstawa składek z eZUS minus 13,71%', () => {
    const account = buildZusAccount(makeProfile({ employment: ['uop'] }), { contributionBase: 9000, debt: 0, certificates: [] });
    const person = applyZusAccount(createPersonForm(['uop']), account);
    expect(person.titles.uop.base).toBe(7766.1);
  });

  it('firma: podstawa i zaległość z konta', () => {
    const account = buildZusAccount(makeProfile({ employment: ['jdg'] }), {
      contributionBase: 5652,
      debt: 62.4,
      certificates: [],
    });
    const person = applyZusAccount(createPersonForm(['jdg']), account);
    expect(person.titles.jdg).toMatchObject({ base: 4877.11, debt: 62.4 });
  });

  it('firma obok etatu (bez chorobowego) — nie zmienia podstawy firmy', () => {
    const before = createPersonForm(['uop', 'jdg']);
    const account = buildZusAccount(makeProfile({ employment: ['uop', 'jdg'] }));
    expect(applyZusAccount(before, account).titles.jdg.base).toBe(before.titles.jdg.base);
  });
});
