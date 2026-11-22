import { Stack } from 'expo-router';

import { useSession } from '@/session';

/**
 * Zakładki są dostępne zawsze — tryb gościa pozwala sprawdzić Wiedzę, Kalkulator i Asystenta
 * bez logowania. `login` chowa się, gdy już zalogowany; `onboarding` chowa się, gdy profil już
 * jest (gościa albo zalogowanego) — jak dotąd, Expo Router sam przekierowuje, gdy `guard` się
 * zmienia, więc zakończenie ankiety albo zalogowanie bez profilu trafia tam, gdzie trzeba.
 */
export function RootNavigator() {
  const { isSignedIn, profile } = useSession();
  const hasProfile = profile !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={!hasProfile}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
