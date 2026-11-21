import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Card } from '@/components/atoms/Card';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useTheme, type TextScale, type ThemeMode } from '@/theme';

import { styles } from './SettingsScreen.styles';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Jak w systemie' },
  { value: 'light', label: 'Jasny' },
  { value: 'dark', label: 'Ciemny' },
];

const TEXT_OPTIONS: { value: TextScale; label: string }[] = [
  { value: 1, label: 'A' },
  { value: 1.15, label: 'A+' },
  { value: 1.3, label: 'A++' },
];

/** Ustawienia wyglądu: motyw i rozmiar tekstu (działają w całej aplikacji od razu). */
export function SettingsScreen() {
  const { colors, mode, setMode, textScale, setTextScale } = useTheme();

  return (
    <ScreenLayout
      title="Ustawienia"
      subtitle="Wygląd aplikacji."
      onBack={() => router.dismissTo(moreRoutes.home)}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        <Card title="Motyw">
          <SegmentedControl label="Motyw" options={THEME_OPTIONS} value={mode} onChange={setMode} />
          <AppText variant="caption" color={colors.textMuted}>
            Domyślnie szanujemy ustawienie telefonu. Ciemny motyw przydaje się przy nocnym karmieniu.
          </AppText>
        </Card>
        <Card title="Rozmiar tekstu">
          <SegmentedControl label="Rozmiar tekstu" options={TEXT_OPTIONS} value={textScale} onChange={setTextScale} />
          <AppText color={colors.textMuted}>Tak wygląda tekst w aplikacji.</AppText>
        </Card>
      </View>
    </ScreenLayout>
  );
}
