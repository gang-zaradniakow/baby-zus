import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  table: {
    gap: spacing.sm,
  },
  row: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  cell: {
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
});
