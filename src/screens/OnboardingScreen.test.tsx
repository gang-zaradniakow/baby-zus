import { screen, userEvent } from '@testing-library/react-native';

import { addDays, today, toISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { renderWithProviders } from '@/testing/renderWithProviders';
import { createSessionProbe } from '@/testing/sessionProbe';

import { OnboardingScreen } from './OnboardingScreen';

/** `useToday` bierze prawdziwą dzisiejszą datę, więc datę urodzenia liczymy względem niej. */
const birthDate = addDays(today(), -10);

async function renderOnboarding() {
  const probe = createSessionProbe();
  await renderWithProviders(
    <>
      <OnboardingScreen />
      <probe.Probe />
    </>,
  );
  return probe;
}

describe('OnboardingScreen — przejście przez ankietę', () => {
  it('pierwszy krok: pytanie o rolę, bez przycisku „Wróć” i „Dalej”', async () => {
    await renderOnboarding();

    expect(screen.getByRole('progressbar', { name: 'Krok 1 z 6' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Kim jesteś dla dziecka?' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Wróć' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Dalej' })).not.toBeOnTheScreen();
  });

  it('cała ankieta zapisuje profil rodzica w sesji', async () => {
    const user = userEvent.setup();
    const { session } = await renderOnboarding();

    // Rola i etap — wybór karty od razu przechodzi dalej.
    await user.press(screen.getByRole('radio', { name: /Tatą/ }));
    await user.press(screen.getByRole('radio', { name: /Maluch jest na świecie/ }));

    // Data urodzenia; „Dalej” odblokowuje się dopiero po poprawnej dacie.
    expect(screen.getByRole('progressbar', { name: 'Krok 3 z 6' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Dalej' })).toBeDisabled();
    await user.type(screen.getByLabelText('Data urodzenia'), formatDate(birthDate).replace(/\./g, ''));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    // Liczba dzieci.
    await user.press(screen.getByRole('radio', { name: /Bliźnięta/ }));

    // Sytuacje szczególne (opcjonalne).
    expect(screen.getByRole('header', { name: 'Sytuacje szczególne' })).toBeOnTheScreen();
    await user.press(screen.getByRole('checkbox', { name: 'Wcześniak / dziecko w szpitalu' }));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    // Zatrudnienie — przy umowie o pracę dochodzi krok „Płatnik”.
    expect(screen.getByRole('header', { name: 'Forma zatrudnienia' })).toBeOnTheScreen();
    await user.press(screen.getByRole('checkbox', { name: 'Umowa o pracę' }));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    // Płatnik — ostatni krok.
    expect(screen.getByRole('progressbar', { name: 'Krok 7 z 7' })).toBeOnTheScreen();
    await user.press(screen.getByRole('radio', { name: /21 osób lub więcej/ }));
    await user.press(screen.getByRole('button', { name: 'Zakończ i uruchom asystenta' }));

    expect(session().profile).toEqual({
      role: 'tata',
      stage: 'dziecko',
      eventDate: toISODate(birthDate),
      childrenCount: 2,
      employment: ['uop'],
      payerSize: 'duzy',
      partner: 'track',
      special: ['preterm'],
    });
  });

  it('błędna data blokuje przejście dalej i pokazuje komunikat', async () => {
    const user = userEvent.setup();
    await renderOnboarding();

    await user.press(screen.getByRole('radio', { name: /Mamą/ }));
    await user.press(screen.getByRole('radio', { name: /Jestem w ciąży/ }));
    await user.type(screen.getByLabelText('Przewidywany termin porodu'), formatDate(birthDate).replace(/\./g, ''));

    expect(screen.getByText(/nie może być w przeszłości/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Dalej' })).toBeDisabled();
  });

  it('„Wróć” cofa do poprzedniego kroku z zachowanym wyborem', async () => {
    const user = userEvent.setup();
    await renderOnboarding();

    await user.press(screen.getByRole('radio', { name: /Opiekunem/ }));
    await user.press(screen.getByRole('button', { name: 'Wróć' }));

    expect(screen.getByRole('progressbar', { name: 'Krok 1 z 6' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: /Opiekunem/ })).toBeChecked();
  });
});
