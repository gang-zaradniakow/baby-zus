import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  group: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
});
