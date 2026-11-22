import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  input: {
    height: 64,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  multiline: {
    minHeight: 120,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
});
