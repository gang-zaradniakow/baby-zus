import { HandHeart, Heart, Smile, type LucideIcon } from 'lucide-react-native';

import type { ParentRole } from '@/domain/profile/ParentProfile';
import type { Tone } from '@/theme';

export type RoleOption = {
  id: ParentRole;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
};

export const ROLE_OPTIONS: readonly RoleOption[] = [
  { id: 'mama', title: 'Mamą', subtitle: 'Zasiłek w ciąży, macierzyński, rodzicielski', icon: Heart, tone: 'primary' },
  { id: 'tata', title: 'Tatą', subtitle: 'Urlop ojcowski i rodzicielski', icon: Smile, tone: 'accent' },
  { id: 'opiekun', title: 'Opiekunem / opiekunką', subtitle: 'Adopcja, rodzina zastępcza', icon: HandHeart, tone: 'primary' },
];
