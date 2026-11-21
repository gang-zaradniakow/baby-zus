import { Pressable } from 'react-native';

import { resolveTone, useTheme } from '@/theme';

import type { TimelineVisuals } from '../resolveTimelineVisuals';

import { styles } from './TimelineDot.styles';

type Props = {
  visuals: TimelineVisuals;
  title: string;
  done: boolean;
  onToggle: () => void;
};

/** Kropka na linii osi czasu. Dotknięcie oznacza zadanie jako zrobione / niezrobione. */
export function TimelineDot({ visuals, title, done, onToggle }: Props) {
  const { colors } = useTheme();
  const { main } = resolveTone(visuals.tone, colors);
  const Icon = visuals.icon;

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={`${done ? 'Oznacz jako niezrobione' : 'Oznacz jako zrobione'}: ${title}`}
      style={({ pressed }) => [
        styles.dot,
        {
          backgroundColor: visuals.filledDot ? main : colors.track,
          borderColor: colors.background,
        },
        pressed && styles.pressed,
      ]}
    >
      <Icon color={visuals.filledDot ? colors.onPrimary : colors.textMuted} size={16} strokeWidth={2.5} />
    </Pressable>
  );
}
