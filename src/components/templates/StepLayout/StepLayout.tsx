import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { styles } from './StepLayout.styles';

type Props = {
  /** Stały nagłówek (np. pasek postępu). */
  header?: ReactNode;
  /** Stała stopka (np. przycisk „Dalej”). */
  footer?: ReactNode;
  children: ReactNode;
};

/** Szkielet kreatora: nagłówek u góry, przewijana treść, przycisk przyklejony do dołu. */
export function StepLayout({ header, footer, children }: Props) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <ScrollView style={styles.body} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}
