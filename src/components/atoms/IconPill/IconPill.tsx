import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { styles } from './IconPill.styles';

type Props = {
  icon: LucideIcon;
  color: string;
  /** Kolor tła „pigułki”; brak = przezroczyste tło. */
  backgroundColor?: string;
  size?: number;
  strokeWidth?: number;
};

/** Ikona w zaokrąglonym tle — jak `p-1 rounded-full bg-[#11734B]/10` w prototypie. */
export function IconPill({ icon: Icon, color, backgroundColor, size = 24, strokeWidth = 2 }: Props) {
  return (
    <View style={[styles.pill, backgroundColor ? { backgroundColor } : null]}>
      <Icon color={color} size={size} strokeWidth={strokeWidth} />
    </View>
  );
}
