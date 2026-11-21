import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './MoreSection.styles';

type Props = {
  title: string;
  children: ReactNode;
};

/** Sekcja huba „Więcej” z nagłówkiem (np. „Pomoc”, „Ustawienia”) i listą wierszy. */
export function MoreSection({ title, children }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <AppText variant="overline" color={colors.textMuted} accessibilityRole="header">
        {title}
      </AppText>
      <View style={styles.list}>{children}</View>
    </View>
  );
}
