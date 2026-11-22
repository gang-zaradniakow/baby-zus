import { ChevronLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { ProgressBar } from '@/components/atoms/ProgressBar';
import { useTheme } from '@/theme';

import { styles } from './OnboardingTopBar.styles';

type Props = {
  step: number;
  total: number;
  /** Brak = przycisk „wstecz” ukryty (pierwszy krok). */
  onBack?: () => void;
};

/** Górny pasek kreatora: strzałka „wstecz” + pasek postępu. */
export function OnboardingTopBar({ step, total, onBack }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Wróć" hitSlop={12} style={styles.back}>
          <ChevronLeft color={colors.textPrimary} size={24} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <View style={styles.progress}>
        <ProgressBar total={total} current={step} />
      </View>
      <View style={styles.back} />
    </View>
  );
}
