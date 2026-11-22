import { Pressable } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './TextButton.styles';

type Props = {
  title: string;
  onPress: () => void;
};

/** Przycisk wyglądający jak link (np. „Policz z Z-3”) — do akcji pobocznych w formularzu. */
export function TextButton({ title, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <AppText variant="label" color={colors.primary} style={styles.text}>
        {title}
      </AppText>
    </Pressable>
  );
}
