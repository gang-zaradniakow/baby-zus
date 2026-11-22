import { createContext } from 'react';

import { lightColors, type ThemeColors } from './colors';

/** `system` — jak w telefonie; `light` / `dark` — wybór użytkownika w Ustawieniach. */
export type ThemeMode = 'system' | 'light' | 'dark';

/** Rozmiar tekstu z Ustawień: A, A+, A++. */
export type TextScale = 1 | 1.15 | 1.3;

export type ThemeValue = {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  textScale: TextScale;
  setTextScale: (scale: TextScale) => void;
};

export const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  isDark: false,
  mode: 'system',
  setMode: () => {},
  textScale: 1,
  setTextScale: () => {},
});
