import { Building2, CircleHelp, Store, type LucideIcon } from 'lucide-react-native';

import type { PayerSize } from '@/domain/profile/ParentProfile';
import type { Tone } from '@/theme';

export type PayerSizeOption = {
  id: PayerSize;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
};

export const PAYER_SIZE_OPTIONS: readonly PayerSizeOption[] = [
  { id: 'duzy', title: '21 osób lub więcej', subtitle: 'Zasiłek wypłaca płatnik', icon: Building2, tone: 'primary' },
  { id: 'maly', title: '20 osób lub mniej', subtitle: 'Zasiłek wypłaca ZUS', icon: Store, tone: 'accent' },
  { id: 'niewiem', title: 'Nie wiem', subtitle: 'Zapytaj w kadrach — pokażemy oba warianty', icon: CircleHelp, tone: 'primary' },
];
