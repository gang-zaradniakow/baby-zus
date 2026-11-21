import { router } from 'expo-router';
import { Heart, HeartCrack } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { ChoiceCard } from '@/components/molecules/ChoiceCard';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import type { LossKind } from '@/data/support/supportItems';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useSession } from '@/session';
import { useTheme } from '@/theme';

import { styles } from './LossScreen.styles';

/** Włączenie trybu wsparcia po stracie — zawsze po wyborze i potwierdzeniu; da się cofnąć. */
export function LossScreen() {
  const { colors } = useTheme();
  const { supportMode, setSupportMode } = useSession();
  const [kind, setKind] = useState<LossKind | null>(null);
  const back = () => router.dismissTo(moreRoutes.situation);

  if (supportMode !== 'none') {
    return (
      <ScreenLayout title="Tryb wsparcia" onBack={back} backLabel="Moja sytuacja">
        <View style={styles.content}>
          <Card tone="accent">
            <AppText>Tryb wsparcia jest włączony.</AppText>
          </Card>
          <Button title="Wyłącz tryb wsparcia" variant="secondary" onPress={() => setSupportMode('none')} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Bardzo nam przykro" onBack={back} backLabel="Moja sytuacja">
      <View style={styles.content}>
        <Card tone="accent">
          <AppText>
            Możemy wyciszyć aplikację: ukryć odliczanie i pokazać tylko to, co może Ci teraz pomóc. Możesz to w każdej
            chwili cofnąć.
          </AppText>
        </Card>
        <AppText variant="cardTitle">Co się wydarzyło?</AppText>
        <View style={styles.choices} accessibilityRole="radiogroup">
          <ChoiceCard
            icon={HeartCrack}
            tone="neutral"
            title="Strata ciąży / martwe urodzenie"
            subtitle="Bez względu na tydzień ciąży"
            selected={kind === 'pregnancyLoss'}
            onPress={() => setKind('pregnancyLoss')}
          />
          <ChoiceCard
            icon={Heart}
            tone="neutral"
            title="Dziecko zmarło po porodzie"
            subtitle="Także po wyjściu ze szpitala"
            selected={kind === 'childDeath'}
            onPress={() => setKind('childDeath')}
          />
        </View>
        <Button
          title="Włącz tryb wsparcia"
          disabled={!kind}
          onPress={() => {
            if (!kind) return;
            setSupportMode(kind);
            router.navigate('/');
          }}
        />
        <Button title="Nie teraz" variant="secondary" onPress={back} />
        <AppText variant="caption" color={colors.textMuted}>
          Rozmowa: 116 123 (telefon zaufania dla dorosłych) · w nagłej sytuacji 112.
        </AppText>
      </View>
    </ScreenLayout>
  );
}
