import { useRef, type ReactNode } from 'react';
import { ScrollView, View, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { styles } from './StepLayout.styles';

type Props = {
  /** Stały nagłówek (np. pasek postępu). */
  header?: ReactNode;
  /** Stała stopka (np. przycisk „Dalej”). */
  footer?: ReactNode;
  children: ReactNode;
  /** Przewijaj na koniec, gdy dochodzi treść (np. nowa wiadomość w rozmowie). */
  autoScrollToEnd?: boolean;
};

/** Szkielet kreatora: nagłówek u góry, przewijana treść, przycisk przyklejony do dołu. */
export function StepLayout({ header, footer, children, autoScrollToEnd = false }: Props) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollViewInstance>(null);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={autoScrollToEnd ? () => scrollRef.current?.scrollToEnd({ animated: true }) : undefined}
      >
        {children}
      </ScrollView>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}
