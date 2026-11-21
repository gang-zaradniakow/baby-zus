import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { useTheme } from '@/theme';

import { styles } from './ScreenLayout.styles';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

/** Wspólny szkielet ekranu zakładki: tło, margines bezpieczny u góry, przewijanie, nagłówek. */
export function ScreenLayout({ title, subtitle, children }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={title} subtitle={subtitle} />
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
