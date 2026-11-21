import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { IconCircle } from '@/components/atoms/IconCircle';
import { resolveTone, useTheme, type Tone } from '@/theme';

import { styles } from './ChoiceCard.styles';

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tone?: Tone;
  selected: boolean;
  onPress: () => void;
};

/** Duża karta jednokrotnego wyboru (ikona + tytuł + podpis), podświetlana kolorem tonu. */
export function ChoiceCard({ icon, title, subtitle, tone = 'primary', selected, onPress }: Props) {
  const { colors } = useTheme();
  const { main, soft } = resolveTone(tone, colors);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.card,
        selected
          ? { borderColor: main, backgroundColor: soft }
          : { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
    >
      <IconCircle icon={icon} tone={tone} />
      <View style={styles.texts}>
        <AppText variant="cardTitle">{title}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {subtitle}
        </AppText>
      </View>
    </Pressable>
  );
}
