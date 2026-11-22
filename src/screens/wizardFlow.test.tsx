import { act, userEvent } from '@testing-library/react-native';
import { Slot, Stack } from 'expo-router';
import { renderRouter, screen } from 'expo-router/testing-library';
import { Text } from 'react-native';

import { addDays, today } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { LegalParamsProvider } from '@/params';
import { SessionProvider } from '@/session';
import { makeProfile } from '@/testing/profiles';
import { createSessionProbe } from '@/testing/sessionProbe';
import { ThemeProvider } from '@/theme';

import { MessagesScreen } from './MessagesScreen';
import { WizardListScreen } from './WizardListScreen';
import { WizardResultScreen } from './WizardResultScreen';
import { WizardScreen } from './WizardScreen';

async function renderApp(initialUrl = '/wiecej/wnioski') {
  const probe = createSessionProbe();
  const app = await renderRouter(
    {
      _layout: () => (
        <ThemeProvider>
          <LegalParamsProvider>
            <SessionProvider>
              <Slot />
              <probe.Probe />
            </SessionProvider>
          </LegalParamsProvider>
        </ThemeProvider>
      ),
      index: () => <Text>ekran Start</Text>,
      login: () => <Text>ekran logowania</Text>,
      'wiecej/_layout': () => <Stack screenOptions={{ headerShown: false }} />,
      'wiecej/wnioski': WizardListScreen,
      'wiecej/wniosek/[wizardId]': WizardScreen,
      'wiecej/dokument/[documentId]': WizardResultScreen,
      'wiecej/wiadomosci': MessagesScreen,
    },
    { initialUrl },
  );
  return { app, session: probe.session };
}

/** Data jako cyfry do pola DD.MM.RRRR (kropki wstawiają się same). */
const typed = (date: Date) => formatDate(date).replace(/\./g, '');

describe('Kreatory wniosków — przepływ', () => {
  it('gość: urlop ojcowski → blokada terminu → podsumowanie → pismo → Moje dokumenty', async () => {
    const user = userEvent.setup();
    const { app } = await renderApp();

    await user.press(screen.getByRole('button', { name: /^Wniosek o urlop ojcowski/ }));
    expect(screen.getByText('Pracodawca / kadry')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Zaczynamy' }));

    // Krok 1 — wybór obowiązkowy.
    await user.press(screen.getByRole('button', { name: 'Dalej' }));
    expect(screen.getByText(/Wybierz jedną z odpowiedzi/)).toBeOnTheScreen();
    await user.press(screen.getByRole('radio', { name: 'Jednorazowo — 14 dni' }));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    // Krok 2 — za wcześnie: blokada z najwcześniejszą datą.
    const field = screen.getByLabelText('Od kiedy (pierwsza część)?');
    await user.clear(field);
    await user.type(field, typed(addDays(today(), 2)));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));
    expect(screen.getByText(/co najmniej 7 dni przed urlopem/)).toBeOnTheScreen();

    await user.clear(field);
    await user.type(field, typed(addDays(today(), 10)));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    // Podsumowanie i pismo.
    expect(screen.getByRole('header', { name: 'Sprawdź i zatwierdź' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /^Jednorazowo — 14 dni/ })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Utwórz pismo' }));

    expect(app).toHavePathname('/wiecej/dokument/w-ojcowski-1');
    expect(screen.getByRole('header', { name: 'Pismo jest gotowe' })).toBeOnTheScreen();
    expect(screen.getByText('o udzielenie urlopu ojcowskiego')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Udostępnij / wyślij do kadr' })).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Wiadomości' }));
    expect(screen.getByRole('radio', { name: 'Moje dokumenty' })).toBeChecked();
    expect(screen.getByRole('button', { name: /^Wniosek o urlop ojcowski\. .*pismo do pracodawcy/ })).toBeOnTheScreen();
  });

  it('w ciąży, sama firma: szkic macierzyńskiego bez logowania → „Szkic zapisany”', async () => {
    const user = userEvent.setup();
    const { session } = await renderApp();
    await act(() => session().completeOnboarding(makeProfile({ stage: 'ciaza', eventDate: '2027-02-15', employment: ['jdg'] })));
    await user.press(screen.getByRole('button', { name: /^Szkic wniosku o zasiłek macierzyński/ }));

    expect(screen.queryByRole('header', { name: 'Zaloguj się' })).toBeNull();
    await user.press(screen.getByRole('button', { name: 'Zaczynamy' }));
    await user.press(screen.getByRole('button', { name: 'Dalej' })); // termin z profilu
    await user.press(screen.getByRole('button', { name: 'Dalej' })); // od porodu
    await user.press(screen.getByRole('button', { name: 'Dalej' })); // liczba dzieci z profilu
    await user.press(screen.getByRole('radio', { name: /^Na razie sam macierzyński/ }));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));
    await user.press(screen.getByRole('button', { name: 'Zapisz szkic' }));

    expect(screen.getByRole('header', { name: 'Szkic zapisany' })).toBeOnTheScreen();
    expect(screen.getByText(/złóż go w eZUS na formularzu ZAM/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Udostępnij szkic' })).toBeOnTheScreen();
  });

  it('gość: wniosek do ZUS (Z-12) wymaga logowania', async () => {
    await renderApp('/wiecej/wniosek/w-pogrzebowy');
    expect(screen.getByRole('header', { name: 'Zaloguj się' })).toBeOnTheScreen();
  });

  it('zalogowana osoba: Z-12 → wniosek przyjęty z numerem UPO', async () => {
    const user = userEvent.setup();
    const { session } = await renderApp('/wiecej/wniosek/w-pogrzebowy');
    await act(() => session().applyPersona('ewa', makeProfile()));

    await user.press(screen.getByRole('button', { name: 'Zaczynamy' }));
    await user.press(screen.getByRole('radio', { name: 'Ja' }));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));
    await user.type(screen.getByLabelText('Kiedy odbył się pochówek?'), typed(addDays(today(), -3)));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));
    await user.press(screen.getByRole('button', { name: 'Dalej' })); // rachunki — można dołączyć później
    await user.press(screen.getByRole('button', { name: 'Wyślij (symulacja)' }));

    expect(screen.getByRole('header', { name: 'Wniosek przyjęty (symulacja: eZUS)' })).toBeOnTheScreen();
    expect(screen.getByText(/^UPO\/\d{4}\/\d{2}\/\d{2}\/000001$/)).toBeOnTheScreen();
    expect(screen.getByText('Z-12')).toBeOnTheScreen();
  });

  it('adopcja: ostrzeżenie (minęło ponad 7 dni) — drugie „Dalej” przechodzi', async () => {
    const user = userEvent.setup();
    await renderApp('/wiecej/wniosek/w-adopcja');

    await user.press(screen.getByRole('button', { name: 'Zaczynamy' }));
    await user.press(screen.getByRole('radio', { name: /^Rodzina zastępcza \(niezawodowa\)/ }));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));
    await user.type(screen.getByLabelText('Kiedy przyjęliście dziecko?'), typed(addDays(today(), -10)));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    expect(screen.getByText(/minęło 10 dni/)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Dalej' }));
    expect(screen.getByRole('header', { name: 'Od kiedy ma się zacząć urlop?' })).toBeOnTheScreen();
  });
});
