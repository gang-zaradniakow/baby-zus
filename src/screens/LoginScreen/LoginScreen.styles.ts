import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

export const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl + spacing.lg,
  },
  footer: {
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  centered: {
    textAlign: 'center',
  },
});
