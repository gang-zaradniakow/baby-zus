import { day } from '@/testing/dates';
import { makeProfile } from '@/testing/profiles';

import { buildZusAccount } from './buildZusAccount';
import { buildZusDocuments } from './buildZusDocuments';

const today = day(2026, 11, 21);

describe('buildZusDocuments', () => {
  it('zawsze informacja o tytułach — z odpowiedzią o chorobowym', () => {
    const insured = makeProfile({ stage: 'ciaza', eventDate: '2027-02-01' });
    const uninsured = makeProfile({ stage: 'ciaza', eventDate: '2027-02-01', employment: ['brak'] });

    expect(buildZusDocuments(insured, buildZusAccount(insured), today)[0].summary).toMatch(/podlegasz ubezpieczeniu/);
    expect(buildZusDocuments(uninsured, buildZusAccount(uninsured), today)[0].summary).toMatch(/nie podlegasz/);
  });

  it('mama 20+ dni po porodzie — informacja o wysokości zasiłku', () => {
    const profile = makeProfile({ eventDate: '2026-10-01' });
    const docs = buildZusDocuments(profile, buildZusAccount(profile), today);
    expect(docs.map((d) => d.id)).toContain('wysokosc-mac');
  });

  it('tuż po porodzie, tata albo zaległość — bez informacji o wysokości', () => {
    const fresh = makeProfile({ eventDate: '2026-11-10' });
    const father = makeProfile({ role: 'tata', eventDate: '2026-10-01' });
    const debtor = makeProfile({ employment: ['jdg'], eventDate: '2026-10-01' });

    expect(buildZusDocuments(fresh, buildZusAccount(fresh), today)).toHaveLength(1);
    expect(buildZusDocuments(father, buildZusAccount(father), today)).toHaveLength(1);
    expect(
      buildZusDocuments(debtor, buildZusAccount(debtor, { contributionBase: 5000, debt: 100, certificates: [] }), today),
    ).toHaveLength(1);
  });

  it('dokłada pisma przykładowej osoby i sortuje od najnowszych', () => {
    const profile = makeProfile({ eventDate: '2026-11-15' });
    const extra = [{ id: 'x', title: 'Starsze', date: '2026-01-01', from: 'ZUS', summary: '', todo: '', body: '' }];
    const docs = buildZusDocuments(profile, buildZusAccount(profile), today, extra);
    expect(docs.map((d) => d.id)).toEqual(['tytuly', 'x']);
  });
});
