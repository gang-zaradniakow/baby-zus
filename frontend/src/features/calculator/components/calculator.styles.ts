import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

/** Wspólny układ sekcji kalkulatora. */
export const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridCell: {
    width: '31%',
    gap: spacing.xxs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  centered: {
    textAlign: 'center',
  },
});
