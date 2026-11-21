import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

import { TIMELINE_DOT_SIZE } from './TimelineDot.styles';

const LINE_WIDTH = 2;

export const styles = StyleSheet.create({
  timeline: {
    gap: spacing.xl,
  },
  /** Linia biegnie przez środek kropek. */
  line: {
    position: 'absolute',
    top: TIMELINE_DOT_SIZE / 2,
    bottom: 0,
    left: TIMELINE_DOT_SIZE / 2 - LINE_WIDTH / 2,
    width: LINE_WIDTH,
  },
});
