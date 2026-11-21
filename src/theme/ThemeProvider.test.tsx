import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as ReactNative from 'react-native';

import { darkColors, lightColors } from './colors';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeProvider + useTheme', () => {
  afterEach(() => jest.restoreAllMocks());

  it('bez providera zwraca jasny motyw', async () => {
    const { result } = await renderHook(() => useTheme());
    expect(result.current.colors).toBe(lightColors);
  });

  it('domyślnie bierze motyw systemu', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toBe(darkColors);
  });

  it('setDark nadpisuje ustawienie systemu', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const { result } = await renderHook(() => useTheme(), { wrapper });

    await act(() => result.current.setDark(true));
    expect(result.current.colors).toBe(darkColors);

    await act(() => result.current.setDark(false));
    expect(result.current.colors).toBe(lightColors);
  });
});
