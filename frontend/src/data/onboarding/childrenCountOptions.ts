import { Baby, Users, UsersRound, type LucideIcon } from 'lucide-react-native';

import type { ChildrenCount } from '@/domain/profile/ParentProfile';
import type { Tone } from '@/theme';

export type ChildrenCountOption = {
  id: ChildrenCount;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
};

export const CHILDREN_COUNT_OPTIONS: readonly ChildrenCountOption[] = [
  { id: 1, title: 'Jedno', subtitle: 'Standardowa długość urlopów', icon: Baby, tone: 'primary' },
  { id: 2, title: 'Bliźnięta', subtitle: 'Dłuższy urlop macierzyński i rodzicielski', icon: Users, tone: 'accent' },
  { id: 3, title: 'Trojaczki lub więcej', subtitle: 'Najdłuższy wymiar urlopów', icon: UsersRound, tone: 'primary' },
];
