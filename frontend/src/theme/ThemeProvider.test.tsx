import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import * as ReactNative from 'react-native';

import { darkColors, lightColors } from './colors';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe('ThemeProvider + useTheme', () => {
  afterEach(() => jest.restoreAllMocks());

  it('bez providera zwraca jasny motyw i zwykły tekst', async () => {
    const { result } = await renderHook(() => useTheme());
    expect(result.current.colors).toBe(lightColors);
    expect(result.current.textScale).toBe(1);
  });

  it('domyślnie bierze motyw systemu', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { result } = await renderHook(() => useTheme(), { wrapper });
    expect(result.current.mode).toBe('system');
    expect(result.current.isDark).toBe(true);
    expect(result.current.colors).toBe(darkColors);
  });

  it('setMode nadpisuje ustawienie systemu i potrafi do niego wrócić', async () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('light');
    const { result } = await renderHook(() => useTheme(), { wrapper });

    await act(() => result.current.setMode('dark'));
    expect(result.current.colors).toBe(darkColors);

    await act(() => result.current.setMode('system'));
    expect(result.current.colors).toBe(lightColors);
  });

  it('setTextScale zmienia rozmiar tekstu', async () => {
    const { result } = await renderHook(() => useTheme(), { wrapper });
    await act(() => result.current.setTextScale(1.3));
    expect(result.current.textScale).toBe(1.3);
  });
});
