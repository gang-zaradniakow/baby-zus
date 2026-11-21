import { Check } from 'lucide-react-native';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { styles } from './Checkbox.styles';

type Props = { checked: boolean };

/**
 * Sam wskaźnik zaznaczenia (kwadrat z ptaszkiem). Nie jest klikalny —
 * klikalny jest cały wiersz (`CheckboxRow`), który też odpowiada za dostępność.
 */
export function Checkbox({ checked }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.box,
        checked
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { borderColor: colors.borderStrong },
      ]}
    >
      {checked ? <Check color={colors.onPrimary} size={16} strokeWidth={3} /> : null}
    </View>
  );
}
