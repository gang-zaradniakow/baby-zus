import { palette } from './palette';

/** Kolory semantyczne: nazwa mówi, DO CZEGO służy kolor, a nie jaki jest. */
export type ThemeColors = {
  background: string;
  surface: string;
  border: string;
  /** Obramowanie elementów sterujących (np. pusty checkbox). */
  borderStrong: string;
  textPrimary: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  /** Tekst/ikona na tle `primary`, `accent`, `danger` lub `mobywatel`. */
  onPrimary: string;
  accent: string;
  accentSoft: string;
  /** Pilne / po terminie. */
  danger: string;
  dangerSoft: string;
  /** Informacyjne (np. NFZ). */
  info: string;
  infoSoft: string;
  /** Tło neutralnych odznak. */
  neutralSoft: string;
  /** Przycisk logowania przez mObywatel (kolor usługi rządowej). */
  mobywatel: string;
  /** Nieaktywna część paska postępu, linia osi czasu. */
  track: string;
  navBackground: string;
  navBorder: string;
  navInactive: string;
};

export const lightColors: ThemeColors = {
  background: palette.white,
  surface: palette.pureWhite,
  border: palette.gray100,
  borderStrong: palette.gray300,
  textPrimary: palette.charcoal,
  textMuted: palette.gray500,
  primary: palette.green,
  primarySoft: palette.greenSoft,
  onPrimary: palette.pureWhite,
  accent: palette.peach,
  accentSoft: palette.peachSoft,
  danger: palette.red600,
  dangerSoft: palette.redSoft,
  info: palette.blue600,
  infoSoft: palette.blueSoft,
  neutralSoft: palette.graySoftLight,
  mobywatel: palette.mobywatelBlue,
  track: palette.gray200,
  navBackground: palette.pureWhite,
  navBorder: palette.gray100,
  navInactive: palette.gray400,
};

export const darkColors: ThemeColors = {
  background: palette.night,
  surface: palette.gray800,
  border: palette.gray700,
  borderStrong: palette.gray600,
  textPrimary: palette.pureWhite,
  textMuted: palette.gray400,
  primary: palette.green,
  primarySoft: palette.greenSoft,
  onPrimary: palette.pureWhite,
  accent: palette.peach,
  accentSoft: palette.peachSoft,
  danger: palette.red400,
  dangerSoft: palette.redSoft,
  info: palette.blue400,
  infoSoft: palette.blueSoft,
  neutralSoft: palette.graySoftDark,
  mobywatel: palette.mobywatelBlue,
  track: palette.gray700,
  navBackground: palette.night,
  navBorder: palette.gray800,
  navInactive: palette.gray500,
};
