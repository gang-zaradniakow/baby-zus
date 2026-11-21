import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

export const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 2,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
