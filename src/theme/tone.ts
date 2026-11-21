import type { ThemeColors } from './colors';

/**
 * Ton = rodzina kolorów elementu (kolor główny + delikatne tło).
 * - `primary` zielony (ZUS, zrobione), `accent` brzoskwiniowy (wyróżnienie, „wkrótce”),
 * - `info` niebieski (NFZ), `danger` czerwony (pilne, po terminie), `neutral` szary.
 */
export type Tone = 'primary' | 'accent' | 'info' | 'danger' | 'neutral';

export type ToneColors = {
  main: string;
  soft: string;
};

export function resolveTone(tone: Tone, colors: ThemeColors): ToneColors {
  switch (tone) {
    case 'accent':
      return { main: colors.accent, soft: colors.accentSoft };
    case 'info':
      return { main: colors.info, soft: colors.infoSoft };
    case 'danger':
      return { main: colors.danger, soft: colors.dangerSoft };
    case 'neutral':
      return { main: colors.textMuted, soft: colors.neutralSoft };
    case 'primary':
    default:
      return { main: colors.primary, soft: colors.primarySoft };
  }
}
