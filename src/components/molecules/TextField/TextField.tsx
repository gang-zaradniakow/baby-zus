import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { typography, useTheme } from '@/theme';

import { styles } from './TextField.styles';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  label: string;
  placeholder?: string;
  hint?: string;
  /** Np. `'name'` dla imienia — podpowiedzi klawiatury i autouzupełnianie. */
  autoComplete?: 'name' | 'given-name' | 'off';
};

/** Jednowierszowe pole tekstowe z etykietą — ten sam wygląd co `DateField`. */
export function TextField({ value, onChangeText, label, placeholder, hint, autoComplete = 'off' }: Props) {
  const { colors } = useTheme();
  const [isFocused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoComplete={autoComplete}
        autoCapitalize="words"
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={[
          styles.input,
          typography.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor: isFocused ? colors.primary : colors.border,
          },
        ]}
      />
      {hint ? (
        <AppText variant="caption" color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
