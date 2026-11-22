import { StyleSheet } from 'react-native';

import { radius } from '@/theme';

export const TIMELINE_DOT_SIZE = 36;

export const styles = StyleSheet.create({
  dot: {
    width: TIMELINE_DOT_SIZE,
    height: TIMELINE_DOT_SIZE,
    borderRadius: radius.pill,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.9 }],
  },
});
