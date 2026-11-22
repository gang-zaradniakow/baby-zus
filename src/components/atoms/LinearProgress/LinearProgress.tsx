import { View } from 'react-native';

import { useTheme } from '@/theme';

import { styles } from './LinearProgress.styles';

type Props = {
  /** Postęp od 0 do 1. */
  progress: number;
  accessibilityLabel: string;
};

/** Ciągły pasek postępu (np. ładowanie aplikacji) — w odróżnieniu od segmentowego `ProgressBar`. */
export function LinearProgress({ progress, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <View
      style={[styles.track, { backgroundColor: colors.track }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <View testID="linear-progress-fill" style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}
