import { act, userEvent } from '@testing-library/react-native';
import { router, Slot, Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';

import { LegalParamsProvider } from '@/params';
import { SessionProvider } from '@/session';
import { ThemeProvider } from '@/theme';

import { AdminScreen } from './AdminScreen';
import { CalculatorScreen } from './CalculatorScreen';

/** Niełamliwe spacje w kwotach. */
const money = (text: string) => new RegExp(text.replace(/ /g, '[\\s\\u00a0]'));

async function renderApp() {
  return renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <LegalParamsProvider>
            <SessionProvider>
              <Slot />
            </SessionProvider>
          </LegalParamsProvider>
        </ThemeProvider>
      ),
      kalkulator: CalculatorScreen,
      'wiecej/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'wiecej/admin': AdminScreen,
    },
    { initialUrl: '/wiecej/admin' },
  );
}

describe('Panel administracyjny', () => {
  it('bez poprawnego hasła nie da się zalogować', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.type(screen.getByLabelText('Hasło'), 'zle');
    expect(screen.getByRole('button', { name: 'Zaloguj' })).toBeDisabled();
  });

  it('zmiana stopy rodzicielskiego z 70% na 80% od razu zmienia kalkulator i trafia do rejestru', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.type(screen.getByLabelText('Hasło'), 'zus2026');
    await user.press(screen.getByRole('button', { name: 'Zaloguj' }));
    expect(screen.getByRole('button', { name: 'Zapisz parametry' })).toBeDisabled();

    await user.clear(screen.getByLabelText('Urlop rodzicielski'));
    await user.type(screen.getByLabelText('Urlop rodzicielski'), '0,8');
    await user.press(screen.getByRole('button', { name: 'Zapisz parametry' }));

    expect(screen.getByText(/Urlop rodzicielski: 0,7 → 0,8/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Urlop rodzicielski (zmienione)')).toBeOnTheScreen();

    // 5 177,40 zł × 80% = 4 141,92 zł → minus 497 zł PIT = 3 644,92 → 3 645 zł (było 3 189 zł przy 70%).
    await act(() => router.push('/kalkulator'));
    // Rodzicielski mamy i 9 tygodni taty — oba po stopie rodzicielskiej.
    expect(await screen.findAllByText(money('3 645 zł'))).toHaveLength(2);
    expect(screen.queryByText(money('3 189 zł'))).not.toBeOnTheScreen();
  });
});
