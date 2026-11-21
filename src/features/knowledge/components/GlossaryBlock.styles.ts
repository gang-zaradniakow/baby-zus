import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

export const styles = StyleSheet.create({
  list: {
    gap: spacing.lg,
  },
  entry: {
    gap: spacing.xs,
    paddingLeft: spacing.md,
    borderLeftWidth: 3,
  },
});
