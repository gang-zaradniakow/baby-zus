import { userEvent } from '@testing-library/react-native';
import { Slot } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';

import { SessionProvider } from '@/session';
import { ThemeProvider } from '@/theme';

import { CalculatorScreen } from './CalculatorScreen';

/** Niełamliwe spacje w kwotach zamieniamy na zwykłe, żeby wyszukiwać tekst czytelnie. */
const money = (text: string) => new RegExp(text.replace(/ /g, '[\\s\\u00a0]'));

async function renderCalculator(initialUrl = '/kalkulator') {
  return renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <SessionProvider>
            <Slot />
          </SessionProvider>
        </ThemeProvider>
      ),
      kalkulator: CalculatorScreen,
    },
    { initialUrl },
  );
}

describe('CalculatorScreen', () => {
  it('domyślnie poród: mama na etacie, pierwszy miesiąc 4 556 zł na rękę (5 177,40 zł × 100% − PIT)', async () => {
    await renderCalculator();

    expect(screen.getByRole('radio', { name: /Zasiłek macierzyński po porodzie/ })).toBeChecked();
    expect(screen.getByText(/Zasiłek macierzyński z ZUS · mama · pierwszy miesiąc/)).toBeOnTheScreen();
    // Karta wyniku + macierzyński mamy + ojcowski taty (domyślnie też etat, 100% tej samej podstawy).
    expect(screen.getAllByText(money('4 556 zł'))).toHaveLength(3);
    expect(screen.getByText('Zasiłek macierzyński za kolejne urlopy')).toBeOnTheScreen();
  });

  it('wariant 81,5% zmienia kwotę pierwszego miesiąca', async () => {
    const user = userEvent.setup();
    await renderCalculator();

    await user.press(screen.getByRole('radio', { name: '81,5%' }));

    // 5 177,40 × 81,5% = 4 219,58 → minus 506 zł PIT = 3 713,58 → 3 714 zł
    // Karta wyniku + macierzyński i rodzicielski mamy (oba po 81,5%).
    expect(screen.getAllByText(money('3 714 zł'))).toHaveLength(3);
  });

  it('„Policz” z artykułu o L4 otwiera wariant ciąży', async () => {
    await renderCalculator('/kalkulator?sytuacja=ciaza');

    expect(screen.getByRole('radio', { name: /Zasiłek chorobowy w ciąży/ })).toBeChecked();
    expect(screen.getByText(/60 dni L4 · 100%/)).toBeOnTheScreen();
    expect(screen.getByText('Wynagrodzenie chorobowe (płaci pracodawca)')).toBeOnTheScreen();
  });

  it('mama „Nie pracuje” — w ciąży brak zasiłku, po porodzie świadczenie z gminy', async () => {
    const user = userEvent.setup();
    await renderCalculator('/kalkulator?sytuacja=ciaza');

    await user.press(screen.getByRole('checkbox', { name: 'Nie pracuje' }));

    expect(screen.getByText('nie przysługuje')).toBeOnTheScreen();
    expect(screen.getByText('Po porodzie: Świadczenie rodzicielskie')).toBeOnTheScreen();
  });

  it('sekcja taty: plan urlopu z suwakami pojawia się po rozwinięciu', async () => {
    const user = userEvent.setup();
    await renderCalculator();

    await user.press(screen.getByRole('button', { name: 'Tata / drugi rodzic' }));

    expect(screen.getByText('Rodzicielski taty')).toBeOnTheScreen();
    expect(screen.getByText('Przejmuje część macierzyńskiego')).toBeOnTheScreen();
    expect(screen.getByText(/Razem rodzina/)).toBeOnTheScreen();
  });

  it('adopcja: rodzaj, data przyjęcia i wiek dziecka', async () => {
    const user = userEvent.setup();
    await renderCalculator();

    await user.press(screen.getByRole('radio', { name: /po przyjęciu dziecka/ }));

    expect(screen.getByRole('radio', { name: 'Rodzina zastępcza' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Data przyjęcia')).toBeOnTheScreen();
    expect(screen.getByLabelText('Wiek dziecka (lata)')).toBeOnTheScreen();
    expect(screen.getByText(/Mama: Urlop na warunkach macierzyńskiego/)).toBeOnTheScreen();
  });
});
