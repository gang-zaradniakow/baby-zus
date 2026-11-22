import { Pressable, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Checkbox } from '@/components/atoms/Checkbox';
import { useTheme } from '@/theme';

import { styles } from './CheckboxRow.styles';

type Props = {
  label: string;
  hint?: string;
  checked: boolean;
  onToggle: () => void;
};

/** Klikalny wiersz wielokrotnego wyboru: checkbox + etykieta + opcjonalna podpowiedź. */
export function CheckboxRow({ label, hint, checked, onToggle }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ checked }}
      style={({ pressed }) => [
        styles.row,
        checked
          ? { borderColor: colors.primary, backgroundColor: colors.primarySoft }
          : { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
    >
      <Checkbox checked={checked} />
      <View style={styles.texts}>
        <AppText variant="label">{label}</AppText>
        {hint ? (
          <AppText variant="caption" color={colors.textMuted}>
            {hint}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
