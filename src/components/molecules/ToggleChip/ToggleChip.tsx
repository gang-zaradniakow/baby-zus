import { Pressable } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './ToggleChip.styles';

type Props = {
  label: string;
  /** Brak — zwykły przycisk-„pigułka” (np. podpowiedź pytania), bez stanu zaznaczenia. */
  selected?: boolean;
  onPress: () => void;
};

/** Mały przełącznik-„pigułka” do wyboru kilku opcji naraz (np. etat + zlecenie) albo przycisk-podpowiedź. */
export function ToggleChip({ label, selected, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={selected === undefined ? 'button' : 'checkbox'}
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { checked: selected }}
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
