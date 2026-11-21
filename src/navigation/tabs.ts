import type { Href } from 'expo-router';
import { Baby, Mail, Menu, MessageCircleHeart, ScrollText, type LucideIcon } from 'lucide-react-native';

import type { Tone } from '@/theme';

export type TabDefinition = {
  /** Nazwa trasy = nazwa pliku w `src/app/(tabs)/`. */
  name: string;
  href: Href;
  label: string;
  icon: LucideIcon;
  /** `accent` wyróżnia zakładkę kolorem brzoskwiniowym — jak Asystent w mZUS. */
  tone: Tone;
};

/** Jedyne źródło prawdy o zakładkach dolnej nawigacji. Kolejność = kolejność na pasku. */
export const TABS: readonly TabDefinition[] = [
  { name: 'index', href: '/', label: 'Start', icon: Baby, tone: 'primary' },
  { name: 'swiadczenia', href: '/swiadczenia', label: 'Świadczenia', icon: ScrollText, tone: 'primary' },
  { name: 'asystent', href: '/asystent', label: 'Asystent', icon: MessageCircleHeart, tone: 'accent' },
  { name: 'wiadomosci', href: '/wiadomosci', label: 'Wiadomości', icon: Mail, tone: 'primary' },
  { name: 'wiecej', href: '/wiecej', label: 'Więcej', icon: Menu, tone: 'primary' },
];
