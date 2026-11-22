import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { LinearProgress } from '@/components/atoms/LinearProgress';
import { BrandLogo } from '@/components/molecules/BrandLogo';
import { StrollerLoader } from '@/components/molecules/StrollerLoader';
import { SPLASH_FACTS } from '@/data/splash/splashFacts';
import { FactCard } from '@/features/splash/components/FactCard';
import { pickFact } from '@/features/splash/pickFact';
import { useLoadingSequence } from '@/features/splash/useLoadingSequence';
import { useTheme } from '@/theme';

import { styles } from './LoadingScreen.styles';

type Props = {
  /** Wywoływane po „Pomiń”, „Dalej” albo po odliczeniu. */
  onFinish: () => void;
};

/** Ekran ładowania przy starcie: logo, jadący wózek, postęp, ciekawostka i „Dalej (n)”. */
export function LoadingScreen({ onFinish }: Props) {
  const { colors } = useTheme();
  const [fact] = useState(() => pickFact(SPLASH_FACTS));
  const { progress, status, secondsLeft } = useLoadingSequence(onFinish);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.glow, { backgroundColor: colors.accentSoft, boxShadow: `0px 0px 80px 60px ${colors.accentSoft}` }]} />

      <Pressable
        onPress={onFinish}
        accessibilityRole="button"
        accessibilityLabel="Pomiń ekran ładowania"
        hitSlop={8}
        style={({ pressed }) => [styles.skip, { backgroundColor: colors.neutralSoft }, pressed && styles.pressed]}
      >
        <AppText variant="label" color={colors.textMuted}>
          Pomiń
        </AppText>
      </Pressable>

      <View style={styles.content}>
        <BrandLogo />
        <StrollerLoader />
        <AppText variant="cardTitle" style={styles.status} accessibilityLiveRegion="polite">
          {status}
        </AppText>
        <LinearProgress progress={progress} accessibilityLabel="Ładowanie aplikacji" />
        <FactCard fact={fact} />
        {secondsLeft !== null ? <Button title={`Dalej (${secondsLeft})`} onPress={onFinish} /> : null}
      </View>
    </SafeAreaView>
  );
}
