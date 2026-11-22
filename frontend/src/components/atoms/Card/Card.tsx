import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { resolveTone, useTheme, type Tone } from '@/theme';

import { styles } from './Card.styles';

type Props = {
  children: ReactNode;
  /** Nagłówek karty, np. „Mama”. */
  title?: string;
  /** Kolorowe tło w tonie (np. wynik „nie przysługuje”); bez tonu — białe tło z obramowaniem. */
  tone?: Tone;
};

/** Karta-sekcja: tło, obramowanie, odstępy między elementami. */
export function Card({ children, title, tone }: Props) {
  const { colors } = useTheme();
  const tint = tone
    ? { backgroundColor: resolveTone(tone, colors).soft, borderColor: 'transparent' }
    : { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <View style={[styles.card, tint]}>
      {title ? (
        <AppText variant="cardTitle" accessibilityRole="header">
          {title}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}
