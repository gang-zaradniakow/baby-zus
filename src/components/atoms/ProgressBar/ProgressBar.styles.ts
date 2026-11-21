import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
  },
});
