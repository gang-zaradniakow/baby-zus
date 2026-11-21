import { act, userEvent } from '@testing-library/react-native';
import { router, Slot, Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { SessionProvider } from '@/session';
import { ThemeProvider } from '@/theme';

import { DemoScreen } from './DemoScreen';
import { DocumentScreen } from './DocumentScreen';
import { MessagesScreen } from './MessagesScreen';
import { MoreScreen } from './MoreScreen';
import { ZusDataScreen } from './ZusDataScreen';

/** Routing jak w aplikacji: Start + stos „Więcej” z ekranami po zalogowaniu i Panelem demo. */
async function renderApp(initialUrl = '/wiecej') {
  return renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <SessionProvider>
            <Slot />
          </SessionProvider>
        </ThemeProvider>
      ),
      index: () => <Text>ekran Start</Text>,
      login: () => <Text>ekran logowania</Text>,
      'wiecej/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'wiecej/index': MoreScreen,
      'wiecej/dane-zus': ZusDataScreen,
      'wiecej/wiadomosci': MessagesScreen,
      'wiecej/pismo/[documentId]': DocumentScreen,
      'wiecej/demo': DemoScreen,
    },
    { initialUrl },
  );
}

/** Panel demo → wybór osoby → powrót do „Więcej”. */
async function choosePersona(name: RegExp) {
  const user = userEvent.setup();
  const app = await renderApp('/wiecej/demo');
  await user.press(screen.getByRole('button', { name }));
  return { user, app };
}

describe('Ekrany po zalogowaniu i Panel demo', () => {
  it('gość: Moje dane z ZUS i Wiadomości proszą o zalogowanie', async () => {
    await renderApp('/wiecej/dane-zus');
    expect(screen.getByRole('header', { name: 'Zaloguj się' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Zaloguj przez mObywatel' })).toBeOnTheScreen();
  });

  it('Panel demo: wybór osoby loguje i wraca na Start', async () => {
    const { app } = await choosePersona(/^Kasia/);
    expect(app).toHavePathname('/');
  });

  it('Kasia: firma z dobrowolnym chorobowym i zaległość blokująca zasiłek', async () => {
    const { user, app } = await choosePersona(/^Kasia/);
    await act(() => router.push('/wiecej/dane-zus'));
    await screen.findByText('Masz ubezpieczenie chorobowe');

    expect(screen.getByText('chorobowe dobrowolne')).toBeOnTheScreen();
    expect(screen.getByText(/Zaległość przekracza próg/)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Przelicz zasiłek na tych danych' }));
    expect(app).toHavePathname('/kalkulator');
  });

  it('Kasia: nowe pismo o zaległości → otwarcie oznacza przeczytane → archiwum', async () => {
    const { user } = await choosePersona(/^Kasia/);
    await act(() => router.push('/wiecej/wiadomosci'));
    await screen.findByRole('radio', { name: 'Korespondencja (1)' });

    await user.press(screen.getByRole('button', { name: /^Informacja o braku wypłaty zasiłku/ }));
    expect(screen.getByText('Co to oznacza? (tłumacz pism)')).toBeOnTheScreen();
    expect(screen.getByText(/Zapłać 62,40 zł/)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Do archiwum' }));
    expect(screen.getByRole('button', { name: 'Przywróć z archiwum' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Wiadomości' }));
    expect(screen.getByRole('radio', { name: 'Korespondencja' })).toBeOnTheScreen(); // już bez licznika
    await user.press(screen.getByRole('radio', { name: 'Archiwum' }));
    expect(screen.getByRole('button', { name: /^Informacja o braku wypłaty zasiłku/ })).toBeOnTheScreen();
  });

  it('Anna: e-ZLA z kodem B, firma obok etatu bez chorobowego', async () => {
    await choosePersona(/^Anna/);
    await act(() => router.push('/wiecej/dane-zus'));
    await screen.findByText('Masz ubezpieczenie chorobowe');

    expect(screen.getByText('bez chorobowego')).toBeOnTheScreen();
    expect(screen.getByText(/kod B \(ciąża — 100%\)/)).toBeOnTheScreen();
  });

  it('zalogowany hub: Moje sprawy w ZUS z licznikiem nieprzeczytanych', async () => {
    await choosePersona(/^Kasia/);
    await act(() => router.push('/wiecej'));

    expect(await screen.findByRole('button', { name: /nieprzeczytane: 1/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Moje dane z ZUS/ })).toBeOnTheScreen();
  });
});
