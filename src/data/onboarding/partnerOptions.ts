import { HeartHandshake, User, Users, type LucideIcon } from 'lucide-react-native';

import type { PartnerMode } from '@/domain/profile/ParentProfile';
import type { Tone } from '@/theme';

export type PartnerOption = {
  id: PartnerMode;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
};

export const PARTNER_OPTIONS: readonly PartnerOption[] = [
  { id: 'track', title: 'Pokaż też jego/jej uprawnienia', subtitle: 'Np. urlop ojcowski i podział rodzicielskiego', icon: Users, tone: 'primary' },
  { id: 'notrack', title: 'Pokazuj tylko moje', subtitle: 'Drugi rodzic sprawdzi swoje osobno', icon: User, tone: 'accent' },
  { id: 'single', title: 'Wychowuję dziecko sama / sam', subtitle: 'Bez uprawnień drugiego rodzica', icon: HeartHandshake, tone: 'primary' },
];
