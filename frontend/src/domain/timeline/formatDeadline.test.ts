import { deadlineAfterDays, deadlineBeforeDays } from '@/domain/deadlines/deadlines';
import { day } from '@/testing/dates';

import { formatDeadline } from './formatDeadline';
import { resolveTimelineItem } from './resolveTimelineItem';
import type { TimelineEntry } from './TimelineItem';

const today = day(2026, 11, 21);
const format = (overrides: Partial<TimelineEntry>) =>
  formatDeadline(
    resolveTimelineItem({ id: 'x', title: 'T', institution: 'ZUS', date: day(2026, 12, 1), ...overrides }, today, false),
  );

describe('formatDeadline', () => {
  it('bez terminu pokazuje samą datę', () => {
    expect(format({})).toBe('01.12.2026');
  });

  it('data szacunkowa bez terminu dostaje „ok.”', () => {
    expect(format({ estimate: true })).toBe('ok. 01.12.2026');
  });

  it('termin „po” przesunięty z niedzieli', () => {
    expect(format({ deadline: deadlineAfterDays(day(2026, 11, 1), 21) })).toBe(
      'termin: 23.11.2026 (poniedziałek) (przesunięty z 22.11.2026 — niedziela)',
    );
  });

  it('termin „po” szacunkowy', () => {
    expect(format({ deadline: deadlineAfterDays(day(2026, 11, 2), 21), estimate: true })).toBe(
      'szacunkowo — termin: 23.11.2026 (poniedziałek)',
    );
  });

  it('termin „przed” w sobotę podpowiada wcześniejszy dzień roboczy', () => {
    expect(format({ deadline: deadlineBeforeDays(day(2027, 5, 8), 14) })).toBe(
      'złóż najpóźniej 24.04.2027 (sobota) — to sobota, więc złóż do 23.04.2027 (piątek)',
    );
  });

  it('termin „przed” liczony od szacunkowej daty dostaje „ok.”', () => {
    expect(format({ deadline: deadlineBeforeDays(day(2027, 5, 8), 14), estimate: true })).toBe(
      'ok. złóż najpóźniej 24.04.2027 (sobota) — to sobota, więc złóż do 23.04.2027 (piątek)',
    );
  });
});
