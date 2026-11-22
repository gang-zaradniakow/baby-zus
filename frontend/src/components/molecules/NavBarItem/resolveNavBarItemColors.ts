import { resolveTone, type ThemeColors, type Tone } from '@/theme';

export type NavBarItemColors = {
  icon: string;
  label: string;
  /** Kolor kółka z poświatą pod ikoną aktywnej zakładki. */
  glow: string | undefined;
};

/** Czysta funkcja: (ton zakładki, czy aktywna, motyw) → kolory elementu paska. */
export function resolveNavBarItemColors(
  tone: Tone,
  isFocused: boolean,
  colors: ThemeColors,
): NavBarItemColors {
  const { main, soft } = resolveTone(tone, colors);

  if (isFocused) {
    return { icon: main, label: main, glow: soft };
  }

  return {
    icon: tone === 'accent' ? main : colors.navInactive,
    label: colors.navInactive,
    glow: undefined,
  };
}
