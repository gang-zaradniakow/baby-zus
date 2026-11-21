import { act, renderHook } from '@testing-library/react-native';

import { makeProfile } from '@/testing/profiles';

import { SessionProvider } from './SessionProvider';
import { useSession } from './useSession';

function renderSession() {
  return renderHook(() => useSession(), { wrapper: SessionProvider });
}

describe('SessionProvider + useSession', () => {
  it('na start: niezalogowany, bez profilu i bez zrobionych zadań', async () => {
    const { result } = await renderSession();

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.profile).toBeNull();
    expect(result.current.completedTaskIds.size).toBe(0);
  });

  it('signIn loguje użytkownika', async () => {
    const { result } = await renderSession();

    await act(() => result.current.signIn());

    expect(result.current.isSignedIn).toBe(true);
  });

  it('toggleTask oznacza zadanie jako zrobione, a ponowne wywołanie cofa to', async () => {
    const { result } = await renderSession();

    await act(() => result.current.toggleTask('usc-zgloszenie'));
    expect(result.current.completedTaskIds.has('usc-zgloszenie')).toBe(true);

    await act(() => result.current.toggleTask('usc-zgloszenie'));
    expect(result.current.completedTaskIds.has('usc-zgloszenie')).toBe(false);
  });

  it('completeOnboarding zapisuje profil i czyści postęp poprzedniej osi czasu', async () => {
    const { result } = await renderSession();
    const profile = makeProfile({ stage: 'ciaza' });

    await act(() => result.current.toggleTask('stare-zadanie'));
    await act(() => result.current.completeOnboarding(profile));

    expect(result.current.profile).toEqual(profile);
    expect(result.current.completedTaskIds.size).toBe(0);
  });

  it('signOut czyści profil, postęp i wylogowuje', async () => {
    const { result } = await renderSession();

    await act(() => result.current.signIn());
    await act(() => result.current.completeOnboarding(makeProfile()));
    await act(() => result.current.toggleTask('usc-zgloszenie'));
    await act(() => result.current.signOut());

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.profile).toBeNull();
    expect(result.current.completedTaskIds.size).toBe(0);
  });

  it('bez providera zwraca bezpieczne wartości domyślne', async () => {
    const { result } = await renderHook(() => useSession());

    expect(result.current.isSignedIn).toBe(false);
    expect(() => result.current.signIn()).not.toThrow();
  });
});
