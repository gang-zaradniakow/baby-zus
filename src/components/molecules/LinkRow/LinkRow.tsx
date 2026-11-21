import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { IconCircle } from '@/components/atoms/IconCircle';
import { useTheme, type Tone } from '@/theme';

import { styles } from './LinkRow.styles';

type Props = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: Tone;
  onPress: () => void;
  /** `link` — prowadzi poza aplikację (np. zus.pl); domyślnie `button`. */
  role?: 'button' | 'link';
};

/** Wiersz listy prowadzący dalej: (ikona) + tytuł + podpis + strzałka. */
export function LinkRow({ title, subtitle, icon, tone = 'primary', onPress, role = 'button' }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={role}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <IconCircle icon={icon} tone={tone} /> : null}
      <View style={styles.texts}>
        <AppText variant="label">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.textMuted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <ChevronRight color={colors.textMuted} size={20} />
    </Pressable>
  );
}
