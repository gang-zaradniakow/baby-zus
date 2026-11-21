import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

/** Układ rozmowy z Asystentem. */
export const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  bubble: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    maxWidth: '92%',
  },
  user: {
    alignSelf: 'flex-end',
  },
  assistant: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  personal: {
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  related: {
    gap: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  feedback: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  composerInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  send: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
});
