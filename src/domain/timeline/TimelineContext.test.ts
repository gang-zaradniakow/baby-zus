import { toISODate } from '@/domain/dates/calendarDate';
import { makeProfile } from '@/testing/profiles';

import { createTimelineContext } from './TimelineContext';

describe('createTimelineContext', () => {
  it('zamienia datę z profilu na obiekt Date', () => {
    expect(toISODate(createTimelineContext(makeProfile()).eventDate)).toBe('2026-11-01');
  });

  it('przy samej firmie zasiłek wypłaca ZUS, przy etacie — pracodawca', () => {
    expect(createTimelineContext(makeProfile({ employment: ['jdg'] })).benefitPayer).toBe('ZUS');
    expect(createTimelineContext(makeProfile({ employment: ['uop', 'jdg'] })).benefitPayer).toBe('PRAC');
  });

  it('przy płatniku do 20 osób zasiłek wypłaca ZUS', () => {
    expect(createTimelineContext(makeProfile({ employment: ['uop'], payerSize: 'maly' })).benefitPayer).toBe('ZUS');
  });

  it('samodzielne wychowywanie wyłącza śledzenie drugiego rodzica', () => {
    expect(createTimelineContext(makeProfile()).tracksPartner).toBe(true);
    expect(createTimelineContext(makeProfile({ partner: 'single' })).tracksPartner).toBe(false);
  });
});
