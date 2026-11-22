import { act, screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/testing/renderWithProviders';
import { createSessionProbe } from '@/testing/sessionProbe';

import { LoginScreen } from './LoginScreen';

const LOGIN = 'Zaloguj przez mObywatel';

describe('LoginScreen', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('pokazuje logo, tytuł i przycisk logowania', async () => {
    await renderWithProviders(<LoginScreen />);

    expect(screen.getByRole('image', { name: 'mZUS dla Rodzica' })).toBeOnTheScreen();
    expect(screen.getByText('Zaloguj się do systemu')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: LOGIN })).toBeEnabled();
  });

  it('logowanie: przycisk zajęty w trakcie, potem użytkownik zalogowany', async () => {
    const { Probe, session } = createSessionProbe();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await renderWithProviders(
      <>
        <LoginScreen />
        <Probe />
      </>,
    );

    await user.press(screen.getByRole('button', { name: LOGIN }));

    expect(screen.getByRole('button', { name: LOGIN })).toBeBusy();
    expect(session().isSignedIn).toBe(false);

    await act(() => jest.advanceTimersByTime(1200));

    expect(session().isSignedIn).toBe(true);
    expect(screen.getByRole('button', { name: LOGIN })).not.toBeBusy();
  });
});
