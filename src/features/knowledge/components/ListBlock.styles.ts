import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

export const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  marker: {
    minWidth: spacing.lg,
  },
  text: {
    flex: 1,
  },
});
