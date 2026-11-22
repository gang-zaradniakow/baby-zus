import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
