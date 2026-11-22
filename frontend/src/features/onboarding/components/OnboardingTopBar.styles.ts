import { StyleSheet } from 'react-native';

import { spacing } from '@/theme';

const BACK_SIZE = 32;

export const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: BACK_SIZE,
    height: BACK_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    flex: 1,
  },
});
