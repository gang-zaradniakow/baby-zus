import { Stack } from 'expo-router';

import { useSession } from '@/session';

/**
 * Decyduje, które ekrany są dostępne w danym stanie sesji:
 * niezalogowany → logowanie, zalogowany bez profilu → onboarding, reszta → zakładki.
 * Expo Router sam przekierowuje, gdy warunek (`guard`) się zmienia.
 */
export function RootNavigator() {
  const { isSignedIn, profile } = useSession();
  const hasProfile = profile !== null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn && !hasProfile}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn && hasProfile}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}
