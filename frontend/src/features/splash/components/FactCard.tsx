import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { shadows, useTheme } from '@/theme';

import { styles } from './FactCard.styles';

type Props = { fact: string };

/** Karta „Czy wiesz, że…” z jedną ciekawostką o świadczeniach. */
export function FactCard({ fact }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, shadows.soft, { backgroundColor: colors.surface }]}>
      <AppText variant="label" color={colors.primary}>
        Czy wiesz, że…
      </AppText>
      <AppText variant="body" color={colors.textPrimary}>
        {fact}
      </AppText>
    </View>
  );
}
