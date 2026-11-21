import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { typography, useTheme } from '@/theme';
import { maskDateInput } from '@/utils/maskDateInput';

import { styles } from './DateField.styles';

type Props = {
  /** Tekst w formacie `DD.MM.RRRR` (może być niepełny w trakcie wpisywania). */
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  hint?: string;
  error?: string | null;
};

const PLACEHOLDER = 'DD.MM.RRRR';

/**
 * Pole daty wpisywanej z klawiatury numerycznej — działa tak samo na Androidzie, iOS i w web.
 * Kropki wstawiają się same.
 */
export function DateField({ value, onChangeText, label, hint, error }: Props) {
  const { colors } = useTheme();
  const [isFocused, setFocused] = useState(false);

  const borderColor = error ? colors.danger : isFocused ? colors.primary : colors.border;

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(maskDateInput(text))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={PLACEHOLDER}
        placeholderTextColor={colors.textMuted}
        keyboardType="number-pad"
        maxLength={PLACEHOLDER.length}
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={[
          styles.input,
          typography.input,
          { color: colors.textPrimary, backgroundColor: colors.surface, borderColor },
        ]}
      />
      {error ? (
        <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
