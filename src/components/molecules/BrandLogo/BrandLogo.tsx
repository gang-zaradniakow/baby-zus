import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { useTheme } from '@/theme';

import { styles } from './BrandLogo.styles';

/** Logotyp „mZUS dla Rodzica” w stylu prototypu: zielony znak + brzoskwiniowy dopisek. */
export function BrandLogo() {
  const { colors } = useTheme();

  return (
    <View style={styles.logo} accessibilityRole="image" accessibilityLabel="mZUS dla Rodzica">
      <AppText variant="logoMark" color={colors.primary}>
        mZUS
      </AppText>
      <AppText variant="logoSub" color={colors.accent} style={styles.sub}>
        dla Rodzica.
      </AppText>
    </View>
  );
}
