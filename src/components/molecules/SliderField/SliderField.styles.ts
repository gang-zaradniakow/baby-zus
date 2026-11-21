import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

export const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flex: 1,
  },
});
