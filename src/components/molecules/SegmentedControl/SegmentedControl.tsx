import { Pressable, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './SegmentedControl.styles';

export type SegmentOption<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Opis grupy dla czytnika ekranu i etykieta nad przyciskami. */
  label?: string;
};

/** Kilka przycisków obok siebie, wybrany jest jeden (np. 1 / 2 / 3 / 4 / 5+). */
export function SegmentedControl<T extends string | number>({ options, value, onChange, label }: Props<T>) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={[styles.group, { backgroundColor: colors.neutralSoft }]}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked: selected }}
              style={[styles.segment, selected && { backgroundColor: colors.surface, borderColor: colors.primary }]}
            >
              <AppText variant="label" color={selected ? colors.primary : colors.textMuted} numberOfLines={1}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
