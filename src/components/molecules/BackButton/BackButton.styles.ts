import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

export const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    marginBottom: spacing.md,
  },
  label: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
