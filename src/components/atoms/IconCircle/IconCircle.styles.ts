import { StyleSheet } from 'react-native';

import { radius } from '@/theme';

export const styles = StyleSheet.create({
  circle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
