import type { Href } from 'expo-router';
import { Baby, BookOpen, Calculator, Menu, MessageCircleHeart, type LucideIcon } from 'lucide-react-native';

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
  { name: 'wiedza', href: '/wiedza', label: 'Wiedza', icon: BookOpen, tone: 'primary' },
  { name: 'asystent', href: '/asystent', label: 'Asystent', icon: MessageCircleHeart, tone: 'accent' },
  { name: 'kalkulator', href: '/kalkulator', label: 'Kalkulator', icon: Calculator, tone: 'primary' },
  { name: 'wiecej', href: '/wiecej', label: 'Więcej', icon: Menu, tone: 'primary' },
];
