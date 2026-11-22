import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { resolveTone, useTheme } from '@/theme';

import { styles } from './ResultHero.styles';

type Props = {
  /** Mały napis nad kwotą, np. „Zasiłek macierzyński z ZUS · mama · pierwszy miesiąc”. */
  label: string;
  /** Kwota albo słowo („nie przysługuje”). */
  value: string;
  /** Np. „/mies.” obok kwoty. */
  unit?: string;
  caption?: string;
  /** `ok` — zielona karta z wynikiem, `off` — nie przysługuje, `alt` — świadczenie zastępcze. */
  kind?: 'ok' | 'off' | 'alt';
};

/** Duża karta z głównym wynikiem kalkulatora. */
export function ResultHero({ label, value, unit, caption, kind = 'ok' }: Props) {
  const { colors } = useTheme();
  const tone = kind === 'ok' ? null : resolveTone(kind === 'off' ? 'neutral' : 'accent', colors);
  const background = tone ? tone.soft : colors.primary;
  const text = tone ? colors.textPrimary : colors.onPrimary;

  return (
    <View style={[styles.hero, { backgroundColor: background }]} accessibilityLiveRegion="polite">
      <AppText variant="caption" color={text}>
        {label}
      </AppText>
      <View style={styles.valueRow}>
        <AppText variant="title" color={text}>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="label" color={text}>
            {unit}
          </AppText>
        ) : null}
      </View>
      {caption ? (
        <AppText variant="caption" color={text}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
}
