import { act, screen, userEvent } from '@testing-library/react-native';

import { addDays, today, toISODate } from '@/domain/dates/calendarDate';
import { makeProfile } from '@/testing/profiles';
import { renderWithProviders } from '@/testing/renderWithProviders';
import { createSessionProbe } from '@/testing/sessionProbe';

import { StartScreen } from './StartScreen';

const profile = makeProfile({ stage: 'dziecko', eventDate: toISODate(addDays(today(), -10)) });

async function renderStart({ withProfile }: { withProfile: boolean }) {
  const probe = createSessionProbe();
  await renderWithProviders(
    <>
      <StartScreen />
      <probe.Probe />
    </>,
  );
  if (withProfile) await act(() => probe.session().completeOnboarding(profile));
  return probe;
}

describe('StartScreen', () => {
  it('bez profilu: CTA ankiety gościa, bez osi czasu', async () => {
    await renderStart({ withProfile: false });

    expect(screen.getByRole('header', { name: 'Start' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Sprawdź bez logowania' })).toBeOnTheScreen();
    expect(screen.queryByRole('checkbox')).not.toBeOnTheScreen();
  });

  it('z profilem: opis sytuacji i zadania na osi czasu', async () => {
    await renderStart({ withProfile: true });

    expect(screen.getByText(/^Dziecko · /)).toBeOnTheScreen();
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  });

  it('dotknięcie kropki odhacza zadanie w sesji i na ekranie', async () => {
    const user = userEvent.setup();
    const { session } = await renderStart({ withProfile: true });
    const dot = screen.getAllByRole('checkbox', { name: /^Oznacz jako zrobione: / })[0];

    await user.press(dot);

    expect(session().completedTaskIds.size).toBe(1);
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(1);
  });
});
