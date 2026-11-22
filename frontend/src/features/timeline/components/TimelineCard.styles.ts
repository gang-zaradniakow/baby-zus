import { StyleSheet } from 'react-native';

import { radius, shadows, spacing } from '@/theme';

export const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
  },
  strong: {
    borderWidth: 2,
    ...shadows.soft,
  },
  normal: {
    borderWidth: 1,
  },
  dashed: {
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  dimmed: {
    opacity: 0.65,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  doneTitle: {
    textDecorationLine: 'line-through',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  dateText: {
    flex: 1,
  },
});
