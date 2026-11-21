import { ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { BrandLogo } from '@/components/molecules/BrandLogo';
import { CenteredLayout } from '@/components/templates/CenteredLayout';
import { useSimulatedLogin } from '@/features/login/useSimulatedLogin';
import { useTheme } from '@/theme';

import { styles } from './LoginScreen.styles';

export function LoginScreen() {
  const { colors } = useTheme();
  const { isLoading, login } = useSimulatedLogin();

  return (
    <CenteredLayout>
      <View style={styles.hero}>
        <BrandLogo />
        <AppText variant="title" style={styles.centered}>
          Zaloguj się do systemu
        </AppText>
        <AppText variant="subtitle" color={colors.textMuted} style={styles.centered}>
          Twój cyfrowy asystent rodzica. Bezpieczne logowanie przez węzeł krajowy.
        </AppText>
      </View>

      <Button
        title="Zaloguj przez mObywatel"
        variant="mobywatel"
        icon={ShieldCheck}
        loading={isLoading}
        onPress={login}
      />

      <View style={styles.footer}>
        <AppText variant="overline" color={colors.textMuted} style={styles.centered}>
          Zakład Ubezpieczeń Społecznych
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={styles.centered}>
          Prototyp — logowanie jest symulowane, dane są fikcyjne.
        </AppText>
      </View>
    </CenteredLayout>
  );
}
