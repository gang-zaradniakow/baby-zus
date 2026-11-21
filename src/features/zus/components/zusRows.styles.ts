import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

/** Wspólny układ wierszy z danymi eZUS (tytuły ubezpieczenia, e-ZLA). */
export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  texts: {
    flex: 1,
    gap: spacing.xxs,
  },
  badges: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
});
