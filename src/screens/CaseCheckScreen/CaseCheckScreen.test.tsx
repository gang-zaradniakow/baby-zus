import { userEvent } from '@testing-library/react-native';
import { Slot, Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';

import { LegalParamsProvider } from '@/params';
import { SessionProvider } from '@/session';
import { ThemeProvider } from '@/theme';

import { CalculatorScreen } from '../CalculatorScreen';

import { CaseCheckScreen } from './CaseCheckScreen';

async function renderApp(initialUrl = '/kalkulator/sprawa') {
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
      'kalkulator/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'kalkulator/index': CalculatorScreen,
      'kalkulator/sprawa': CaseCheckScreen,
    },
    { initialUrl },
  );
}

describe('CaseCheckScreen', () => {
  it('kalkulator → „Sprawdź sprawę”', async () => {
    const user = userEvent.setup();
    const app = await renderApp('/kalkulator');

    await user.press(screen.getByRole('button', { name: /^Sprawdź sprawę/ }));

    expect(app).toHavePathname('/kalkulator/sprawa');
  });

  it('domyślnie: pracownica ubezpieczona od 2024 — świadczenie przysługuje', async () => {
    await renderApp();
    expect(screen.getByText(/Świadczenie przysługuje/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Spełnione: Ubezpieczenie chorobowe w dniu zdarzenia/)).toBeOnTheScreen();
  });

  it('brak ubezpieczenia — nie przysługuje i nie ma przejścia do kalkulatora', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.press(screen.getByRole('radio', { name: 'Brak ubezpieczenia chorobowego' }));

    expect(screen.getByText(/nie przysługuje lub jest wstrzymane/)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Przelicz w kalkulatorze zasiłków' })).not.toBeOnTheScreen();
  });

  it('firma z zaległością — wstrzymane; L4 przy krótkim ubezpieczeniu — okres wyczekiwania', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.press(screen.getByRole('radio', { name: 'Działalność gospodarcza (chorobowe dobrowolne)' }));
    await user.type(screen.getByLabelText('Zadłużenie składkowe na dzień powstania prawa'), '100');
    expect(screen.getByText(/zasiłek wstrzymany do spłaty/)).toBeOnTheScreen();

    await user.press(screen.getByRole('radio', { name: 'Zasiłek chorobowy w ciąży' }));
    expect(screen.getByText(/ZAS-53/)).toBeOnTheScreen();
  });

  it('„Przelicz” otwiera kalkulator na właściwej sytuacji', async () => {
    const user = userEvent.setup();
    const app = await renderApp();

    await user.press(screen.getByRole('radio', { name: 'Przyjęcie dziecka na wychowanie' }));
    await user.press(screen.getByRole('button', { name: 'Przelicz w kalkulatorze zasiłków' }));

    expect(app).toHavePathname('/kalkulator');
    expect(screen.getByRole('radio', { name: /po przyjęciu dziecka/ })).toBeChecked();
  });
});
