import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { resolveTone, useTheme, type Tone } from '@/theme';

import { styles } from './IconCircle.styles';

type Props = {
  icon: LucideIcon;
  tone?: Tone;
};

/** Ikona w kole z delikatnym tłem w kolorze tonu (w-12 h-12 rounded-full z prototypu). */
export function IconCircle({ icon: Icon, tone = 'primary' }: Props) {
  const { colors } = useTheme();
  const { main, soft } = resolveTone(tone, colors);

  return (
    <View style={[styles.circle, { backgroundColor: soft }]}>
      <Icon color={main} size={24} />
    </View>
  );
}
