import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { styles } from './CenteredLayout.styles';

type Props = { children: ReactNode };

/** Pełnoekranowy szkielet z treścią wyśrodkowaną w pionie (np. logowanie). */
export function CenteredLayout({ children }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {children}
    </SafeAreaView>
  );
}
