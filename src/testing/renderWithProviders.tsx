import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { SessionProvider } from '@/session';
import { ThemeProvider } from '@/theme';

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}

/** `render` z RNTL owinięty w providery aplikacji (motyw + sesja). */
export function renderWithProviders(element: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(element, { wrapper: AllProviders, ...options });
}
