import { StyleSheet } from 'react-native';

import { radius, spacing } from '@/theme';

/** Kółko mieści ikonę 24 px z marginesem `spacing.sm` z każdej strony. */
const CIRCLE_SIZE = spacing.xl + 2 * spacing.sm;

export const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
