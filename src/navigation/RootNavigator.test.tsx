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
async function renderApp(initialUrl = '/') {
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
    { initialUrl },
  );

  return { ...result, session };
}

describe('RootNavigator — tryb gościa i logowanie', () => {
  it('gość (bez logowania, bez profilu) od razu widzi zakładki ze Startem', async () => {
    const app = await renderApp('/');

    expect(screen.getByText('ekran Start')).toBeOnTheScreen();
    expect(app).toHavePathname('/');
  });

  it('ekran logowania jest dostępny pod /login, nawet dla gościa', async () => {
    await renderApp('/login');

    expect(screen.getByText('ekran logowania')).toBeOnTheScreen();
  });

  it('gość wypełnia ankietę bez logowania — po zakończeniu trafia na zakładki', async () => {
    const app = await renderApp('/onboarding');
    expect(screen.getByText('ekran onboardingu')).toBeOnTheScreen();

    await act(() => app.session().completeOnboarding(makeProfile()));

    expect(screen.getByText('ekran Start')).toBeOnTheScreen();
    expect(app).toHavePathname('/');
  });

  it('logowanie trafia na zakładki — tam gości CTA ankiety, gdy nie ma jeszcze profilu', async () => {
    const app = await renderApp('/login');

    await act(() => app.session().signIn());

    expect(screen.getByText('ekran Start')).toBeOnTheScreen();
    expect(app).toHavePathname('/');
  });

  it('logowanie z profilem gościa (ankieta już wypełniona) trafia na zakładki', async () => {
    const app = await renderApp('/login');

    await act(() => app.session().completeOnboarding(makeProfile()));
    await act(() => app.session().signIn());

    expect(screen.getByText('ekran Start')).toBeOnTheScreen();
  });
});
