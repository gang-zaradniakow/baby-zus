import type { ViewStyle } from 'react-native';

import { spacing } from '@/theme';

/** Rozmycie i rozlanie poświaty — tokeny odstępów, żeby nie było „magicznych liczb”. */
const GLOW_BLUR = spacing.lg;
const GLOW_SPREAD = spacing.xs;

/** Czysta funkcja: kolor tonu → wypełnione kółko z rozmytą poświatą (`boxShadow` działa na iOS, Androidzie i web). */
export function resolveGlowStyle(glowColor: string): ViewStyle {
  return {
    backgroundColor: glowColor,
    boxShadow: `0px 0px ${GLOW_BLUR}px ${GLOW_SPREAD}px ${glowColor}`,
  };
}
