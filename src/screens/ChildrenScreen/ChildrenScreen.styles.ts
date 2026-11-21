import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

export const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
});
