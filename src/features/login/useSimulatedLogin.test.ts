import { act, renderHook } from '@testing-library/react-native';

import { SessionProvider, useSession } from '@/session';

import { useSimulatedLogin } from './useSimulatedLogin';

/** Hook logowania razem z sesją, żeby zobaczyć efekt `signIn`. */
function renderLogin() {
  return renderHook(
    () => ({ login: useSimulatedLogin(), session: useSession() }),
    { wrapper: SessionProvider },
  );
}

describe('useSimulatedLogin', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('na start nic się nie ładuje i użytkownik nie jest zalogowany', async () => {
    const { result } = await renderLogin();

    expect(result.current.login.isLoading).toBe(false);
    expect(result.current.session.isSignedIn).toBe(false);
  });

  it('login: najpierw ładowanie, po 1,2 s zalogowanie', async () => {
    const { result } = await renderLogin();

    await act(() => result.current.login.login());
    expect(result.current.login.isLoading).toBe(true);
    expect(result.current.session.isSignedIn).toBe(false);

    await act(() => jest.advanceTimersByTime(1199));
    expect(result.current.session.isSignedIn).toBe(false);

    await act(() => jest.advanceTimersByTime(1));
    expect(result.current.login.isLoading).toBe(false);
    expect(result.current.session.isSignedIn).toBe(true);
  });

  it('odmontowanie w trakcie ładowania kasuje zaplanowane logowanie', async () => {
    const setTimeoutSpy = jest.spyOn(globalThis, 'setTimeout');
    const clearTimeoutSpy = jest.spyOn(globalThis, 'clearTimeout');
    const { result, unmount } = await renderLogin();

    await act(() => result.current.login.login());
    const loginTimerIndex = setTimeoutSpy.mock.calls.findIndex(([, delay]) => delay === 1200);
    const loginTimer = setTimeoutSpy.mock.results[loginTimerIndex].value;

    await unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(loginTimer);
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });
});
