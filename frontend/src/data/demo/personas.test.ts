import { buildZusAccount } from '@/domain/zus/buildZusAccount';
import { day } from '@/testing/dates';

import { findPersona, PERSONAS } from './personas';

const today = day(2026, 11, 21);

describe('PERSONAS', () => {
  it('6 osób z prototypu, unikalne id, poprawne daty w profilach', () => {
    expect(PERSONAS).toHaveLength(6);
    expect(new Set(PERSONAS.map((p) => p.id)).size).toBe(6);
    for (const persona of PERSONAS) {
      expect(persona.profile(today).eventDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('daty liczone względem dzisiaj (Kasia: synek ma 16 dni)', () => {
    expect(findPersona('kasia')?.profile(today).eventDate).toBe('2026-11-05');
  });

  it('Anna: etat + firma — chorobowe tylko z etatu, e-ZLA z kodem B', () => {
    const anna = findPersona('anna')!;
    const account = buildZusAccount(anna.profile(today), anna.zus(today));
    expect(account.titles.map((t) => t.sickness)).toEqual(['mandatory', 'none']);
    expect(account.certificates[0].code).toBe('B');
  });

  it('nieznana osoba — null', () => {
    expect(findPersona('nikt')).toBeNull();
    expect(findPersona(null)).toBeNull();
  });
});
