import { act, screen, userEvent } from '@testing-library/react-native';

import { makeProfile } from '@/testing/profiles';
import { renderWithProviders } from '@/testing/renderWithProviders';
import { createSessionProbe } from '@/testing/sessionProbe';

import { MoreScreen } from './MoreScreen';

async function renderMore() {
  const { Probe, session } = createSessionProbe();
  await renderWithProviders(
    <>
      <MoreScreen />
      <Probe />
    </>,
  );
  return session;
}

describe('MoreScreen', () => {
  it('zalogowany: „Wyloguj” wylogowuje, ale zostawia profil', async () => {
    const user = userEvent.setup();
    const session = await renderMore();
    const profile = makeProfile();
    await act(() => session().signIn());
    await act(() => session().completeOnboarding(profile));

    await user.press(screen.getByRole('button', { name: 'Wyloguj' }));

    expect(session().isSignedIn).toBe(false);
    expect(session().profile).toEqual(profile);
  });

  it('gość: „Usuń moje odpowiedzi i zacznij od nowa” czyści profil', async () => {
    const user = userEvent.setup();
    const session = await renderMore();
    await act(() => session().completeOnboarding(makeProfile()));

    await user.press(screen.getByRole('button', { name: 'Usuń moje odpowiedzi i zacznij od nowa' }));

    expect(session().isSignedIn).toBe(false);
    expect(session().profile).toBeNull();
  });
});
