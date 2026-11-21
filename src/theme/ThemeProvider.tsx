import { useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from './colors';
import { ThemeContext, type ThemeValue } from './ThemeContext';

type Props = { children: ReactNode };

/**
 * Trzyma wybór trybu jasny/ciemny. Domyślnie bierze ustawienie systemu;
 * `setDark` pozwoli później podpiąć przełącznik „Tryb nocny” z profilu.
 */
export function ThemeProvider({ children }: Props) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<boolean | null>(null);
  const isDark = override ?? systemScheme === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      setDark: setOverride,
    }),
    [isDark],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
