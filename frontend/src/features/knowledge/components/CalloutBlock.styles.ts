import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  box: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderLeftWidth: 4,
  },
});
