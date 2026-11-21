import { act, userEvent } from '@testing-library/react-native';
import { router, Slot, Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';

import { SessionProvider } from '@/session';
import { makeProfile } from '@/testing/profiles';
import { createSessionProbe } from '@/testing/sessionProbe';
import { ThemeProvider } from '@/theme';

import { ChildrenScreen } from './ChildrenScreen';
import { LossScreen } from './LossScreen';
import { SituationScreen } from './SituationScreen';
import { StartScreen } from './StartScreen';

async function renderApp(initialUrl = '/wiecej/sytuacja') {
  const probe = createSessionProbe();
  const app = await renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <SessionProvider>
            <Slot />
            <probe.Probe />
          </SessionProvider>
        </ThemeProvider>
      ),
      index: StartScreen,
      'wiecej/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'wiecej/sytuacja': SituationScreen,
      'wiecej/strata': LossScreen,
      'wiecej/dzieci': ChildrenScreen,
    },
    { initialUrl },
  );
  return { app, session: probe.session };
}

describe('Tryb wsparcia po stracie', () => {
  it('włączenie wymaga wyboru i potwierdzenia, potem Start bez osi czasu', async () => {
    const user = userEvent.setup();
    const { app, session } = await renderApp();
    await act(() => session().completeOnboarding(makeProfile({ stage: 'ciaza', eventDate: '2027-02-01' })));

    await user.press(screen.getByRole('button', { name: /^Straciłam ciążę lub dziecko/ }));
    expect(screen.getByRole('button', { name: 'Włącz tryb wsparcia' })).toBeDisabled();

    await user.press(screen.getByRole('radio', { name: /Strata ciąży \/ martwe urodzenie/ }));
    await user.press(screen.getByRole('button', { name: 'Włącz tryb wsparcia' }));

    expect(app).toHavePathname('/');
    expect(session().supportMode).toBe('pregnancyLoss');
    expect(screen.getByRole('header', { name: 'Jesteśmy z Tobą' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Zasiłek macierzyński — 8 tygodni/ })).toBeOnTheScreen();
    expect(screen.queryByRole('header', { name: 'Oś czasu' })).not.toBeOnTheScreen();
  });

  it('„To pomyłka” wraca do zwykłego Startu', async () => {
    const user = userEvent.setup();
    const { session } = await renderApp('/');
    await act(() => session().completeOnboarding(makeProfile()));
    await act(() => session().setSupportMode('childDeath'));

    expect(screen.getByRole('button', { name: /^Rozmowa z ekspertem ZUS/ })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'To pomyłka / chcę wrócić do zwykłego widoku' }));

    expect(session().supportMode).toBe('none');
    expect(screen.getByRole('header', { name: 'Oś czasu' })).toBeOnTheScreen();
  });

  it('przy włączonym trybie ekran straty pozwala go wyłączyć', async () => {
    const user = userEvent.setup();
    const { session } = await renderApp('/wiecej/strata');
    await act(() => session().setSupportMode('pregnancyLoss'));

    await user.press(screen.getByRole('button', { name: 'Wyłącz tryb wsparcia' }));
    expect(session().supportMode).toBe('none');
  });

  it('profil dziecka z ankiety; nowe dziecko = ankieta od nowa', async () => {
    const { session } = await renderApp('/wiecej/dzieci');
    await act(() => session().completeOnboarding(makeProfile({ childName: 'Staś' })));

    expect(screen.getByText('Staś')).toBeOnTheScreen();
    expect(screen.getByText(/^Dziecko · /)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Nowa ciąża lub przyjęte dziecko/ })).toBeOnTheScreen();
    await act(() => router.push('/wiecej/sytuacja'));
    expect(screen.getByRole('button', { name: /^Przyjęliśmy dziecko/ })).toBeOnTheScreen();
  });
});
