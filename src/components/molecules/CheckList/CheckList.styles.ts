import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  text: {
    flex: 1,
  },
});
