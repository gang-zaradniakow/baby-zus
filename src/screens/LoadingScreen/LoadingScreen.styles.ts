import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

/** Rozmyta brzoskwiniowa plama u góry ekranu (jak w prototypie). */
const GLOW_SIZE = 240;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: radius.pill,
    top: -GLOW_SIZE / 2,
    alignSelf: 'center',
  },
  skip: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  status: {
    textAlign: 'center',
  },
});
