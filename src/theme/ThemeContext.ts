import { createContext } from 'react';

import { lightColors, type ThemeColors } from './colors';

export type ThemeValue = {
  colors: ThemeColors;
  isDark: boolean;
  setDark: (isDark: boolean) => void;
};

export const ThemeContext = createContext<ThemeValue>({
  colors: lightColors,
  isDark: false,
  setDark: () => {},
});
