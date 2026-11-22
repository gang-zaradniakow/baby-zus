import type { ThemeColors } from '@/theme';

export type ButtonVariant = 'primary' | 'mobywatel' | 'secondary';

export type ButtonColors = {
  background: string;
  border: string;
  text: string;
};

/** Czysta funkcja: wariant przycisku → kolory z motywu. */
export function resolveButtonColors(variant: ButtonVariant, colors: ThemeColors): ButtonColors {
  switch (variant) {
    case 'mobywatel':
      return { background: colors.mobywatel, border: colors.mobywatel, text: colors.onPrimary };
    case 'secondary':
      return { background: colors.surface, border: colors.borderStrong, text: colors.textPrimary };
    case 'primary':
    default:
      return { background: colors.primary, border: colors.primary, text: colors.onPrimary };
  }
}
