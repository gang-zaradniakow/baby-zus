import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { styles } from './IconGlow.styles';
import { resolveGlowStyle } from './resolveGlowStyle';

type Props = {
  icon: LucideIcon;
  color: string;
  /** Kolor kółka i rozmytej poświaty wokół niego; brak = sama ikona. */
  glowColor?: string;
  size?: number;
  strokeWidth?: number;
};

/** Ikona w kółku z rozmytą poświatą (blur) — wyróżnia aktywną zakładkę dolnej nawigacji. */
export function IconGlow({ icon: Icon, color, glowColor, size = 24, strokeWidth = 2 }: Props) {
  return (
    <View testID="icon-glow" style={[styles.circle, glowColor ? resolveGlowStyle(glowColor) : null]}>
      <Icon color={color} size={size} strokeWidth={strokeWidth} />
    </View>
  );
}
