import { Pressable } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './ToggleChip.styles';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Mały przełącznik-„pigułka” do wyboru kilku opcji naraz (np. etat + zlecenie). */
export function ToggleChip({ label, selected, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <AppText variant="label" color={selected ? colors.primary : colors.textPrimary}>
        {label}
      </AppText>
    </Pressable>
  );
}
