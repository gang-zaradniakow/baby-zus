import Slider from '@react-native-community/slider';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './SliderField.styles';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Jednostka przy wartości, np. „tyg.”. */
  unit?: string;
  onChange: (value: number) => void;
};

/** Suwak z etykietą i bieżącą wartością (np. „Rodzicielski taty: 9 tyg.”). */
export function SliderField({ label, value, min, max, step = 1, unit, onChange }: Props) {
  const { colors } = useTheme();
  const valueText = unit ? `${value} ${unit}` : String(value);

  return (
    <View style={styles.field}>
      <View style={styles.header}>
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
        <AppText variant="label" color={colors.primary}>
          {valueText}
        </AppText>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={Math.max(min, max)}
        step={step}
        disabled={max <= min}
        onValueChange={onChange}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.track}
        thumbTintColor={colors.primary}
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value, text: valueText }}
      />
    </View>
  );
}
