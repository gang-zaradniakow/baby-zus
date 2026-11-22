import { Baby, CalendarHeart, HandHeart, HeartPulse, type LucideIcon } from 'lucide-react-native';

import type { ParentStage } from '@/domain/profile/ParentProfile';
import type { Tone } from '@/theme';

export type StageOption = {
  id: ParentStage;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
};

export const STAGE_OPTIONS: readonly StageOption[] = [
  { id: 'planuje', title: 'Planuję dziecko', subtitle: 'Ile dostanę w ciąży i po porodzie', icon: CalendarHeart, tone: 'accent' },
  { id: 'ciaza', title: 'Jestem w ciąży', subtitle: 'Formalności przed porodem', icon: HeartPulse, tone: 'primary' },
  { id: 'dziecko', title: 'Maluch jest na świecie', subtitle: 'Zasiłki i zgłoszenia', icon: Baby, tone: 'accent' },
  { id: 'adopcja', title: 'Przyjęliśmy dziecko', subtitle: 'Adopcja lub rodzina zastępcza', icon: HandHeart, tone: 'primary' },
];
