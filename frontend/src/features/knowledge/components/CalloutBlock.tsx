import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { RichText } from '@/components/atoms/RichText';
import { resolveTone, useTheme } from '@/theme';

import { styles } from './CalloutBlock.styles';

type Props = {
  kind: 'important' | 'example';
  text: string;
};

const CALLOUTS = {
  important: { label: 'WAŻNE!', tone: 'accent' },
  example: { label: 'Przykład', tone: 'info' },
} as const;

/** Ramka z Poradnika: „WAŻNE!” (brzoskwiniowa) albo „Przykład” (niebieska). */
export function CalloutBlock({ kind, text }: Props) {
  const { colors } = useTheme();
  const callout = CALLOUTS[kind];
  const { main, soft } = resolveTone(callout.tone, colors);

  return (
    <View style={[styles.box, { backgroundColor: soft, borderLeftColor: main }]}>
      <AppText variant="overline" color={main}>
        {callout.label}
      </AppText>
      <RichText text={text} />
    </View>
  );
}
