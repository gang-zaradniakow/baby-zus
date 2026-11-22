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
  /** Kilka linii (np. treść wiadomości). */
  multiline?: boolean;
};

/** Pole tekstowe z etykietą (jedno- lub wielowierszowe) — ten sam wygląd co `DateField`. */
export function TextField({ value, onChangeText, label, placeholder, hint, autoComplete = 'off', multiline = false }: Props) {
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
        autoCapitalize={multiline ? 'sentences' : 'words'}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={label}
        accessibilityHint={hint}
        style={[
          multiline ? styles.multiline : styles.input,
          multiline ? typography.body : typography.input,
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
