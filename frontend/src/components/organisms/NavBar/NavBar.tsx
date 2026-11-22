import type { ComponentRef, Ref } from 'react';
import { View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing, useTheme } from '@/theme';

import { styles } from './NavBar.styles';

type Props = Omit<ViewProps, 'ref'> & { ref?: Ref<ComponentRef<typeof View>> };

/**
 * Kontener dolnej nawigacji: tło, obramowanie, cień i margines bezpieczny (notch / gesty).
 * Nie wie nic o zakładkach — dostaje gotowe przyciski jako `children`
 * (podpinany przez `<TabList asChild>`).
 */
export function NavBar({ style, children, ...rest }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      accessibilityRole="tablist"
      {...rest}
      style={[
        styles.bar,
        {
          backgroundColor: colors.navBackground,
          borderTopColor: colors.navBorder,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
