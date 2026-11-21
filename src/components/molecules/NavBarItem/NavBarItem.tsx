import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentRef, Ref } from 'react';
import { Pressable, type View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { IconPill } from '@/components/atoms/IconPill';
import type { TabDefinition } from '@/navigation/tabs';
import { useTheme } from '@/theme';

import { styles } from './NavBarItem.styles';
import { resolveNavBarItemColors } from './resolveNavBarItemColors';

type Props = TabTriggerSlotProps & {
  tab: TabDefinition;
  ref?: Ref<ComponentRef<typeof View>>;
};

/**
 * Pojedynczy przycisk dolnej nawigacji.
 * `isFocused`, `onPress` i `ref` wstrzykuje `TabTrigger asChild` z expo-router.
 */
export function NavBarItem({ tab, isFocused = false, ...triggerProps }: Props) {
  const { colors } = useTheme();
  const tint = resolveNavBarItemColors(tab.tone, isFocused, colors);

  return (
    <Pressable
      {...triggerProps}
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <IconPill
        icon={tab.icon}
        color={tint.icon}
        backgroundColor={tint.pill}
        strokeWidth={isFocused ? 2.5 : 2}
      />
      <AppText
        variant={isFocused ? 'navLabelActive' : 'navLabel'}
        color={tint.label}
        numberOfLines={1}
      >
        {tab.label}
      </AppText>
    </Pressable>
  );
}
