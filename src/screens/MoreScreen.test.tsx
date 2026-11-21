import { act, screen, userEvent } from '@testing-library/react-native';

import { makeProfile } from '@/testing/profiles';
import { renderWithProviders } from '@/testing/renderWithProviders';
import { createSessionProbe } from '@/testing/sessionProbe';

import { MoreScreen } from './MoreScreen';

describe('MoreScreen', () => {
  it('„Wyloguj i zacznij od nowa” czyści sesję', async () => {
    const { Probe, session } = createSessionProbe();
    const user = userEvent.setup();
    await renderWithProviders(
      <>
        <MoreScreen />
        <Probe />
      </>,
    );
    await act(() => session().signIn());
    await act(() => session().completeOnboarding(makeProfile()));

    await user.press(screen.getByRole('button', { name: 'Wyloguj i zacznij od nowa' }));

    expect(session().isSignedIn).toBe(false);
    expect(session().profile).toBeNull();
  });
});
