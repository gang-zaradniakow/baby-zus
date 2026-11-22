/**
 * Surowa paleta barw przeniesiona z prototypu ZUS baby (zus_baby_prototype.tsx).
 * Komponenty NIE importują palety bezpośrednio — korzystają z kolorów
 * semantycznych z `colors.ts` (przez hook `useTheme`).
 */
export const palette = {
  green: '#11734B',
  peach: '#FF8A8A',
  charcoal: '#2D3748',
  white: '#FBFBFD',
  sand: '#F4F4F5',
  night: '#1A202C',
  pureWhite: '#FFFFFF',

  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',

  mobywatelBlue: '#0052A5',
  red400: '#F87171',
  red600: '#DC2626',
  blue400: '#60A5FA',
  blue600: '#2563EB',

  greenSoft: 'rgba(17, 115, 75, 0.10)',
  peachSoft: 'rgba(255, 138, 138, 0.12)',
  redSoft: 'rgba(239, 68, 68, 0.12)',
  blueSoft: 'rgba(59, 130, 246, 0.12)',
  graySoftLight: 'rgba(107, 114, 128, 0.10)',
  graySoftDark: 'rgba(156, 163, 175, 0.14)',
} as const;
