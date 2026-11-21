import { Pressable, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './RadioRow.styles';

type Props = {
  label: string;
  hint?: string;
  selected: boolean;
  onPress: () => void;
};

/** Wiersz jednokrotnego wyboru: kółko + etykieta + podpowiedź (bez ikony, do dłuższych odpowiedzi). */
export function RadioRow({ label, hint, selected, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      accessibilityState={{ checked: selected }}
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border },
      ]}
    >
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.borderStrong }]}>
        {selected ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
      </View>
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
