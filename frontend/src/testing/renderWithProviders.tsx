import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

import { LegalParamsProvider } from '@/params';
import { SessionProvider } from '@/session';
import { ThemeProvider } from '@/theme';

function AllProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LegalParamsProvider>
        <SessionProvider>{children}</SessionProvider>
      </LegalParamsProvider>
    </ThemeProvider>
  );
}

/** `render` z RNTL owinięty w providery aplikacji (motyw + parametry prawne + sesja). */
export function renderWithProviders(element: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(element, { wrapper: AllProviders, ...options });
}
