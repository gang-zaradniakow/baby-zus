import {
  AlarmClock,
  AlertTriangle,
  CalendarDays,
  Check,
  Circle,
  Clock,
  Flag,
  type LucideIcon,
} from 'lucide-react-native';

import { formatDaysLeft } from '@/domain/timeline/formatDaysLeft';
import type { TimelineItem } from '@/domain/timeline/TimelineItem';
import type { Tone } from '@/theme';

const URGENT_DAYS = 7;

export type CardEmphasis = 'strong' | 'normal' | 'dashed';

export type TimelineVisuals = {
  /** Kolor kropki i obramowania karty. */
  tone: Tone;
  icon: LucideIcon;
  /** Kropka wypełniona kolorem (aktywne/zrobione) czy szara (przyszłe/minione). */
  filledDot: boolean;
  emphasis: CardEmphasis;
  /** Przygaszona karta (zrobione / minione). */
  dimmed: boolean;
  statusLabel: string | null;
};

/** Czysta funkcja: status pozycji → wygląd (bez kolorów — te dobiera komponent z motywu). */
export function resolveTimelineVisuals(item: TimelineItem): TimelineVisuals {
  switch (item.status) {
    case 'done':
      return { tone: 'primary', icon: Check, filledDot: true, emphasis: 'normal', dimmed: true, statusLabel: 'zrobione' };
    case 'late':
      return { tone: 'danger', icon: AlertTriangle, filledDot: true, emphasis: 'strong', dimmed: false, statusLabel: 'po terminie' };
    case 'now': {
      const urgent = item.daysLeft <= URGENT_DAYS;
      return {
        tone: urgent ? 'danger' : 'accent',
        icon: item.milestone ? Flag : urgent ? AlarmClock : Clock,
        filledDot: true,
        emphasis: 'strong',
        dimmed: false,
        statusLabel: formatDaysLeft(item.daysLeft),
      };
    }
    case 'past':
      return { tone: 'neutral', icon: Circle, filledDot: false, emphasis: 'normal', dimmed: true, statusLabel: null };
    case 'future':
      return {
        tone: 'neutral',
        icon: item.milestone ? Flag : CalendarDays,
        filledDot: false,
        emphasis: 'dashed',
        dimmed: false,
        statusLabel: null,
      };
  }
}
