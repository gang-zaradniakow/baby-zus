import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './Accordion.styles';

type Props = {
  title: string;
  children: ReactNode;
  initiallyOpen?: boolean;
};

/** Zwijana sekcja (np. „Tata / drugi rodzic”, „Więcej opcji”) — jak `<details>` w prototypie. */
export function Accordion({ title, children, initiallyOpen = false }: Props) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <View style={[styles.box, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: open }}
        style={styles.header}
      >
        <AppText variant="label" style={styles.title}>
          {title}
        </AppText>
        <Chevron color={colors.textMuted} size={20} />
      </Pressable>
      {open ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}
