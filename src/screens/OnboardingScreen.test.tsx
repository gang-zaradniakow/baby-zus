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

describe('OnboardingScreen — przejście przez kreator', () => {
  it('krok 1: pytanie o etap, bez przycisku „Wróć” i „Dalej”', async () => {
    await renderOnboarding();

    expect(screen.getByRole('progressbar', { name: 'Krok 1 z 4' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Na jakim etapie teraz jesteś?' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Wróć' })).not.toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Dalej' })).not.toBeOnTheScreen();
  });

  it('cały kreator zapisuje profil rodzica w sesji', async () => {
    const user = userEvent.setup();
    const { session } = await renderOnboarding();

    // Krok 1 — wybór karty od razu przechodzi dalej.
    await user.press(screen.getByRole('radio', { name: /Maluch jest na świecie/ }));

    // Krok 2 — data urodzenia; „Dalej” odblokowuje się dopiero po poprawnej dacie.
    expect(screen.getByRole('progressbar', { name: 'Krok 2 z 4' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Dalej' })).toBeDisabled();
    await user.type(screen.getByLabelText('Data urodzenia'), formatDate(birthDate).replace(/\./g, ''));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    // Krok 3 — zatrudnienie.
    expect(screen.getByRole('header', { name: 'Forma zatrudnienia' })).toBeOnTheScreen();
    await user.press(screen.getByRole('checkbox', { name: 'Umowa o pracę' }));
    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    // Krok 4 — sytuacje szczególne (opcjonalne) i zakończenie.
    expect(screen.getByRole('header', { name: 'Sytuacje szczególne' })).toBeOnTheScreen();
    await user.press(screen.getByRole('checkbox', { name: 'Samodzielne wychowywanie' }));
    await user.press(screen.getByRole('button', { name: 'Zakończ i uruchom asystenta' }));

    expect(session().profile).toEqual({
      stage: 'dziecko',
      eventDate: toISODate(birthDate),
      employment: ['uop'],
      special: ['single'],
    });
  });

  it('błędna data blokuje przejście dalej i pokazuje komunikat', async () => {
    const user = userEvent.setup();
    await renderOnboarding();

    await user.press(screen.getByRole('radio', { name: /Jestem w ciąży/ }));
    await user.type(screen.getByLabelText('Przewidywany termin porodu'), formatDate(birthDate).replace(/\./g, ''));

    expect(screen.getByText(/nie może być w przeszłości/)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Dalej' })).toBeDisabled();
  });

  it('„Wróć” cofa do poprzedniego kroku z zachowanym wyborem', async () => {
    const user = userEvent.setup();
    await renderOnboarding();

    await user.press(screen.getByRole('radio', { name: /Przyjęliśmy dziecko/ }));
    await user.press(screen.getByRole('button', { name: 'Wróć' }));

    expect(screen.getByRole('progressbar', { name: 'Krok 1 z 4' })).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: /Przyjęliśmy dziecko/ })).toBeChecked();
  });
});
