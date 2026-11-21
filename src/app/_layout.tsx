import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@/navigation/RootNavigator';
import { LegalParamsProvider } from '@/params';
import { SessionProvider } from '@/session';
import { ThemeProvider } from '@/theme';

/** Tylko „opakowania” aplikacji (providery). Logika tras jest w RootNavigator. */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LegalParamsProvider>
          <SessionProvider>
            <StatusBar style="auto" />
            <RootNavigator />
          </SessionProvider>
        </LegalParamsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
