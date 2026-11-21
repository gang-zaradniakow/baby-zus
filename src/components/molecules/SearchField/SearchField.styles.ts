import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    height: '100%',
  },
});
