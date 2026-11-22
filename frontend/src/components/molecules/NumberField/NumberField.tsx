import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { typography, useTheme } from '@/theme';
import { parseDecimal } from '@/utils/parseDecimal';

import { styles } from './NumberField.styles';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  /** Np. „zł”, „dni”, „g” — za polem. */
  unit?: string;
  /** Liczby całkowite (dni, gramy) — klawiatura bez przecinka. */
  integer?: boolean;
  /** Mniejsze pole — np. w siatce 12 miesięcy Z-3. */
  compact?: boolean;
  placeholder?: string;
};

const display = (value: number) => (value ? String(value).replace('.', ',') : '');

/**
 * Pole liczby z polską klawiaturą (przecinek dziesiętny). Trzyma własny tekst, żeby dało się
 * wpisać „12,” w trakcie pisania; rodzic dostaje już liczbę.
 */
export function NumberField({ label, value, onChange, hint, unit, integer = false, compact = false, placeholder }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState(display(value));
  const [lastValue, setLastValue] = useState(value);
  const [isFocused, setFocused] = useState(false);

  // Wartość zmieniona z zewnątrz (np. ustawienia z profilu) — pokaż ją. Wzorzec Reacta
  // „dopasuj stan w trakcie renderu” zamiast efektu.
  if (value !== lastValue) {
    setLastValue(value);
    if (parseDecimal(text) !== value) setText(display(value));
  }

  const handleChange = (next: string) => {
    setText(next);
    onChange(integer ? Math.round(parseDecimal(next)) : parseDecimal(next));
  };

  return (
    <View style={styles.field}>
      <AppText variant={compact ? 'caption' : 'label'}>{label}</AppText>
      <View
        style={[
          styles.box,
          compact && styles.compact,
          { backgroundColor: colors.surface, borderColor: isFocused ? colors.primary : colors.border },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          accessibilityHint={hint}
          style={[styles.input, typography.body, { color: colors.textPrimary }]}
        />
        {unit ? (
          <AppText variant="caption" color={colors.textMuted}>
            {unit}
          </AppText>
        ) : null}
      </View>
      {hint ? (
        <AppText variant="caption" color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
