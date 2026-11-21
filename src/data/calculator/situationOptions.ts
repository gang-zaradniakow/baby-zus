import { Baby, HandHeart, HeartPulse, type LucideIcon } from 'lucide-react-native';

import type { CalculatorSituation } from '@/domain/calculator/CalculatorSituation';
import type { Tone } from '@/theme';

export type SituationOption = {
  id: CalculatorSituation;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
};

/** „Co chcesz policzyć?” — trzy warianty kalkulatora z prototypu. */
export const SITUATION_OPTIONS: readonly SituationOption[] = [
  {
    id: 'pregnancy',
    title: 'Zasiłek chorobowy w ciąży',
    subtitle: 'Jesteś w ciąży na zwolnieniu lekarskim (L4)',
    icon: HeartPulse,
    tone: 'accent',
  },
  {
    id: 'birth',
    title: 'Zasiłek macierzyński po porodzie',
    subtitle: 'Za urlop macierzyński, rodzicielski i ojcowski',
    icon: Baby,
    tone: 'primary',
  },
  {
    id: 'adoption',
    title: 'Zasiłek macierzyński po przyjęciu dziecka',
    subtitle: 'Adopcja lub rodzina zastępcza',
    icon: HandHeart,
    tone: 'primary',
  },
];
