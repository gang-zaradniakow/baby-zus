import { formatDate } from '@/domain/dates/formatDate';
import { makeProfile } from '@/testing/profiles';

import { planningEntries } from './planningEntries';
import { createTimelineContext } from './TimelineContext';

const entriesFor = (employment: NonNullable<Parameters<typeof makeProfile>[0]>['employment']) =>
  planningEntries(createTimelineContext(makeProfile({ stage: 'planuje', eventDate: '2027-09-01', employment })));

describe('planningEntries', () => {
  it('etat: 12 miesięcy podstawy i umowa na czas określony; wszystko orientacyjne', () => {
    const entries = entriesFor(['uop']);
    expect(entries.map((e) => e.id)).toEqual(['plan-podstawa', 'plan-umowa']);
    expect(entries.every((e) => e.estimate)).toBe(true);
    // 40 tyg. przed 01.09.2027 = 25.11.2026; 12 mies. wcześniej.
    expect(formatDate(entries[0].date)).toBe('25.11.2025');
    expect(entries[1].institution).toBe('PRAC');
  });

  it('firma: dobrowolne chorobowe 90 dni przed początkiem ciąży, w ZUS', () => {
    const entries = entriesFor(['jdg']);
    const voluntary = entries.find((e) => e.id === 'plan-chorobowe');
    expect(voluntary).toMatchObject({ institution: 'ZUS' });
    expect(formatDate(voluntary!.date)).toBe('27.08.2026');
    expect(entries.some((e) => e.id === 'plan-umowa')).toBe(false);
  });
});
