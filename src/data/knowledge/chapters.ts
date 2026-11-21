import {
  Baby,
  HeartPulse,
  Hospital,
  Info,
  ShieldCheck,
  TriangleAlert,
  Users,
  type LucideIcon,
} from 'lucide-react-native';

import type { Chapter } from '@/domain/knowledge/Chapter';
import type { Tone } from '@/theme';

export type ChapterEntry = Chapter & {
  icon: LucideIcon;
  tone: Tone;
};

/** Rozdziały zakładki „Wiedza” w kolejności Poradnika ZUS. */
export const CHAPTERS: readonly ChapterEntry[] = [
  { id: 'start', title: 'Zanim zaczniesz', lead: 'Najważniejsze pojęcia i kontakt z ZUS.', icon: Info, tone: 'primary' },
  {
    id: 'ubezp',
    title: 'Ubezpieczenie — klucz do zasiłków',
    lead: 'Kto podlega ubezpieczeniu chorobowemu i co z tego wynika.',
    icon: ShieldCheck,
    tone: 'info',
  },
  {
    id: 'ciaza',
    title: 'W ciąży',
    lead: 'Zwolnienie lekarskie, zasiłek chorobowy, urlop przed porodem.',
    icon: HeartPulse,
    tone: 'accent',
  },
  {
    id: 'po',
    title: 'Po narodzinach i przyjęciu dziecka',
    lead: 'Zasiłek macierzyński za wszystkie urlopy.',
    icon: Baby,
    tone: 'primary',
  },
  {
    id: 'trudne',
    title: 'Trudne sytuacje',
    lead: 'Martwe urodzenie, śmierć dziecka, szpital, wsparcie.',
    icon: Hospital,
    tone: 'neutral',
  },
  { id: 'opieka', title: 'Gdy dziecko choruje', lead: 'Zasiłek opiekuńczy.', icon: Users, tone: 'info' },
  {
    id: 'ryzyka',
    title: 'Ryzyka — czego unikać',
    lead: 'Kiedy można stracić albo obniżyć świadczenie.',
    icon: TriangleAlert,
    tone: 'danger',
  },
];
