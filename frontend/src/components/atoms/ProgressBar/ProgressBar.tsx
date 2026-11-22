import { View } from 'react-native';

import { useTheme } from '@/theme';

import { styles } from './ProgressBar.styles';

type Props = {
  /** Liczba wszystkich kroków. */
  total: number;
  /** Bieżący krok, liczony od 1. */
  current: number;
};

/** Pasek postępu z segmentów — jeden segment na krok. */
export function ProgressBar({ total, current }: Props) {
  const { colors } = useTheme();
  const segments = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <View
      style={styles.bar}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Krok ${current} z ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
    >
      {segments.map((step) => (
        <View
          key={step}
          style={[styles.segment, { backgroundColor: step <= current ? colors.primary : colors.track }]}
        />
      ))}
    </View>
  );
}
