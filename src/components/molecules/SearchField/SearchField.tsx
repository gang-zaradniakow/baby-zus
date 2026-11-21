import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { typography, useTheme } from '@/theme';

import { styles } from './SearchField.styles';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  /** Opis pola dla czytnika ekranu. */
  label: string;
  placeholder?: string;
};

/** Pole wyszukiwania z ikoną lupy. */
export function SearchField({ value, onChangeText, label, placeholder }: Props) {
  const { colors } = useTheme();
  const [isFocused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.field,
        { backgroundColor: colors.surface, borderColor: isFocused ? colors.primary : colors.border },
      ]}
    >
      <Search color={colors.textMuted} size={20} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        accessibilityRole="search"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={[styles.input, typography.body, { color: colors.textPrimary }]}
      />
    </View>
  );
}
