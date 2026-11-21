import { AlarmClock, AlertTriangle, CalendarDays, Check, Clock, Flag } from 'lucide-react-native';

import type { TimelineItem, TimelineStatus } from '@/domain/timeline/TimelineItem';
import { day } from '@/testing/dates';

import { resolveTimelineVisuals } from './resolveTimelineVisuals';

const item = (status: TimelineStatus, daysLeft = 0, milestone = false): TimelineItem => ({
  id: 'x',
  title: 'T',
  institution: 'ZUS',
  date: day(2026, 11, 21),
  due: day(2026, 11, 21),
  daysLeft,
  status,
  milestone,
});

describe('resolveTimelineVisuals', () => {
  it('zrobione: zielony ptaszek, przygaszona karta', () => {
    expect(resolveTimelineVisuals(item('done'))).toMatchObject({
      tone: 'primary',
      icon: Check,
      dimmed: true,
      statusLabel: 'zrobione',
    });
  });

  it('po terminie: czerwone ostrzeżenie', () => {
    expect(resolveTimelineVisuals(item('late', -3))).toMatchObject({
      tone: 'danger',
      icon: AlertTriangle,
      emphasis: 'strong',
      statusLabel: 'po terminie',
    });
  });

  it('do 7 dni: pilne, czerwone, z odliczaniem', () => {
    expect(resolveTimelineVisuals(item('now', 2))).toMatchObject({
      tone: 'danger',
      icon: AlarmClock,
      statusLabel: 'za 2 dni',
    });
  });

  it('8–30 dni: brzoskwiniowe „wkrótce”', () => {
    expect(resolveTimelineVisuals(item('now', 15))).toMatchObject({ tone: 'accent', icon: Clock, statusLabel: 'za 15 dni' });
  });

  it('przyszłe: szara kropka, przerywana ramka, bez odznaki statusu', () => {
    expect(resolveTimelineVisuals(item('future', 90))).toMatchObject({
      tone: 'neutral',
      icon: CalendarDays,
      filledDot: false,
      emphasis: 'dashed',
      statusLabel: null,
    });
  });

  it('kamień milowy ma ikonę flagi — także gdy jest blisko', () => {
    expect(resolveTimelineVisuals(item('future', 90, true)).icon).toBe(Flag);
    expect(resolveTimelineVisuals(item('now', 2, true)).icon).toBe(Flag);
  });

  it('minione: przygaszone, bez odznaki', () => {
    expect(resolveTimelineVisuals(item('past', -10))).toMatchObject({ dimmed: true, statusLabel: null });
  });
});
