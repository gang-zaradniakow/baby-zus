import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { resolveTone, useTheme, type Tone } from '@/theme';

import { styles } from './Badge.styles';

type Props = {
  label: string;
  tone?: Tone;
};

/** Mała odznaka z etykietą (np. „ZUS”, „za 3 dni”) — `text-[10px] uppercase rounded` z prototypu. */
export function Badge({ label, tone = 'neutral' }: Props) {
  const { colors } = useTheme();
  const { main, soft } = resolveTone(tone, colors);

  return (
    <View style={[styles.badge, { backgroundColor: soft }]}>
      <AppText variant="badge" color={main}>
        {label}
      </AppText>
    </View>
  );
}
