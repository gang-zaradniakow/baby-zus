import type { TextStyle } from 'react-native';

/**
 * Warianty tekstu. Nowy wariant dodajemy tutaj, a nie przez lokalne
 * `fontSize`/`fontWeight` w komponentach.
 */
export const typography = {
  logoMark: { fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  logoSub: { fontSize: 28, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  body: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '700' },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  badge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { fontSize: 20, fontWeight: '700', letterSpacing: 2 },
  navLabel: { fontSize: 10, fontWeight: '700' },
  navLabelActive: { fontSize: 10, fontWeight: '900' },
  /** Tylko wewnątrz innego tekstu (pogrubienie w akapicie) — rozmiar dziedziczy po rodzicu. */
  strong: { fontWeight: '800' },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
