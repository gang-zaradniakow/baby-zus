import { Slot } from 'expo-router';
import { act, renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { SessionProvider } from '@/session';
import { makeProfile } from '@/testing/profiles';
import { createSessionProbe } from '@/testing/sessionProbe';
import { ThemeProvider } from '@/theme';

import { RootNavigator } from './RootNavigator';

/**
 * Prawdziwy routing expo-router z RootNavigator jako głównym layoutem.
 * Ekrany to zaślepki z tekstem — test sprawdza tylko, który ekran jest dostępny.
 */
async function renderApp() {
  const { Probe, session } = createSessionProbe();

  const result = await renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <SessionProvider>
            <RootNavigator />
            <Probe />
          </SessionProvider>
        </ThemeProvider>
      ),
      login: () => <Text>ekran logowania</Text>,
      onboarding: () => <Text>ekran onboardingu</Text>,
      '(tabs)/_layout': () => <Slot />,
      '(tabs)/index': () => <Text>ekran Start</Text>,
    },
    { initialUrl: '/' },
  );

  return { ...result, session };
}

describe('RootNavigator — strażnicy tras', () => {
  it('niezalogowany trafia na logowanie, nawet gdy otwiera Start', async () => {
    const app = await renderApp();

    expect(screen.getByText('ekran logowania')).toBeOnTheScreen();
    expect(app).toHavePathname('/login');
  });

  it('po zalogowaniu bez profilu: onboarding', async () => {
    const app = await renderApp();

    await act(() => app.session().signIn());

    expect(screen.getByText('ekran onboardingu')).toBeOnTheScreen();
    expect(app).toHavePathname('/onboarding');
  });

  it('po onboardingu: zakładki z ekranem Start', async () => {
    const app = await renderApp();

    await act(() => app.session().signIn());
    await act(() => app.session().completeOnboarding(makeProfile()));

    expect(screen.getByText('ekran Start')).toBeOnTheScreen();
    expect(app).toHavePathname('/');
  });

  it('wylogowanie wraca na ekran logowania', async () => {
    const app = await renderApp();

    await act(() => app.session().signIn());
    await act(() => app.session().completeOnboarding(makeProfile()));
    await act(() => app.session().signOut());

    expect(screen.getByText('ekran logowania')).toBeOnTheScreen();
    expect(app).toHavePathname('/login');
  });
});
