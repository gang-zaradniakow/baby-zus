import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './ScreenHeader.styles';

type Props = {
  title: string;
  subtitle?: string;
};

/** Tytuł ekranu + opcjonalny podtytuł (np. „Oś czasu / Twoje urzędowe kroki.”). */
export function ScreenHeader({ title, subtitle }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="subtitle" color={colors.textMuted}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}
