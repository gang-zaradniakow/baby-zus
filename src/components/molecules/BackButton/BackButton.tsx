import { ChevronLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './BackButton.styles';

type Props = {
  onPress: () => void;
  /** Domyślnie „Wróć”; np. nazwa rozdziału, do którego wracamy. */
  label?: string;
};

/** Strzałka „wstecz” z podpisem — nad tytułem ekranów zagnieżdżonych (rozdział, artykuł). */
export function BackButton({ onPress, label = 'Wróć' }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={12}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <ChevronLeft color={colors.primary} size={20} />
      <AppText variant="label" color={colors.primary} numberOfLines={1} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}
