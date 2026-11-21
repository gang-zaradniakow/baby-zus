import { userEvent } from '@testing-library/react-native';
import { Slot, Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { SessionProvider } from '@/session';
import { ThemeProvider } from '@/theme';

import { AboutScreen } from './AboutScreen';
import { ContactScreen } from './ContactScreen';
import { MoreScreen } from './MoreScreen';
import { SupportScreen } from './SupportScreen';

/** Prawdziwy routing expo-router z ekranami „Więcej” — jak w `src/app/(tabs)/wiecej/`. */
async function renderMore(initialUrl = '/wiecej') {
  return renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <SessionProvider>
            <Slot />
          </SessionProvider>
        </ThemeProvider>
      ),
      'wiecej/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'wiecej/index': MoreScreen,
      'wiecej/kontakt': ContactScreen,
      'wiecej/wsparcie': SupportScreen,
      'wiecej/o-aplikacji': AboutScreen,
      onboarding: () => <Text>ekran ankiety</Text>,
      login: () => <Text>ekran logowania</Text>,
    },
    { initialUrl },
  );
}

describe('Więcej — hub i podekrany', () => {
  it('gość widzi logowanie, ankietę, pomoc i informacje', async () => {
    await renderMore();

    expect(screen.getByRole('button', { name: 'Zaloguj przez mObywatel' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Wypełnij ankietę/ })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Pomoc' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^O aplikacji/ })).toBeOnTheScreen();
  });

  it('hub → Kontakt → „Wróć” do huba', async () => {
    const user = userEvent.setup();
    const app = await renderMore();

    await user.press(screen.getByRole('button', { name: /^e-Wizyta i mama@zus\.pl/ }));
    expect(app).toHavePathname('/wiecej/kontakt');

    await user.press(screen.getByRole('button', { name: 'Więcej' }));
    expect(app).toHavePathname('/wiecej');
  });

  it('Kontakt: rezerwacja e-wizyty po wyborze tematu, dnia i godziny', async () => {
    const user = userEvent.setup();
    await renderMore('/wiecej/kontakt');

    expect(screen.getByRole('button', { name: 'Zarezerwuj' })).toBeDisabled();
    await user.press(screen.getByRole('checkbox', { name: 'L4 w ciąży' }));
    await user.press(screen.getAllByRole('checkbox', { name: /\d{2}\.\d{2}$/ })[0]);
    await user.press(screen.getByRole('checkbox', { name: '10:30' }));
    await user.press(screen.getByRole('button', { name: 'Zarezerwuj' }));

    expect(screen.getByText(/Zarezerwowano \(zaślepka\): L4 w ciąży/)).toBeOnTheScreen();
  });

  it('Kontakt: wiadomość na mama@zus.pl — zaślepka bez wysyłki', async () => {
    const user = userEvent.setup();
    await renderMore('/wiecej/kontakt');

    await user.type(screen.getByLabelText('Treść'), 'Pytanie o Z-3');
    await user.press(screen.getByRole('button', { name: 'Wyślij (zaślepka)' }));

    expect(screen.getByText(/W prototypie nic nie jest wysyłane/)).toBeOnTheScreen();
  });

  it('Wsparcie: organizacje, telefony i strony', async () => {
    await renderMore('/wiecej/wsparcie');

    expect(screen.getByRole('link', { name: /^Fundacja Wcześniak Rodzice-Rodzicom/ })).toBeOnTheScreen();
    expect(screen.getByText('Bractwo Małych Stópek')).toBeOnTheScreen(); // bez adresu — sama nazwa
    expect(screen.getByRole('link', { name: /^116 123/ })).toBeOnTheScreen();
  });

  it('„Wypełnij ankietę” prowadzi do ankiety', async () => {
    const user = userEvent.setup();
    const app = await renderMore();

    await user.press(screen.getByRole('button', { name: /^Wypełnij ankietę/ }));

    expect(app).toHavePathname('/onboarding');
  });
});
