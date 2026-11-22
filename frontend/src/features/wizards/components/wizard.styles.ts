import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

/** Wspólny układ kreatora wniosków. */
export const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
  },
  options: {
    gap: spacing.sm,
  },
  topBar: {
    gap: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  letter: {
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  right: {
    textAlign: 'right',
  },
  centered: {
    textAlign: 'center',
  },
  signature: {
    marginTop: spacing.xl,
    textAlign: 'right',
  },
});
