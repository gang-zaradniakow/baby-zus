import { useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from './colors';
import { ThemeContext, type TextScale, type ThemeMode, type ThemeValue } from './ThemeContext';

type Props = { children: ReactNode };

/** Trzyma wybór motywu (jak w systemie / jasny / ciemny) i rozmiar tekstu z Ustawień. */
export function ThemeProvider({ children }: Props) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('system');
  const [textScale, setTextScale] = useState<TextScale>(1);
  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';

  const value = useMemo<ThemeValue>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      mode,
      setMode,
      textScale,
      setTextScale,
    }),
    [isDark, mode, textScale],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
