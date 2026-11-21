import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  compact: {
    height: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  input: {
    flex: 1,
    height: '100%',
  },
});
