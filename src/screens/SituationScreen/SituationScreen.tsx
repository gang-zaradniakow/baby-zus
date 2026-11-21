import { router } from 'expo-router';
import { Baby, HeartCrack } from 'lucide-react-native';
import { View } from 'react-native';

import { LinkRow } from '@/components/molecules/LinkRow';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { moreRoutes } from '@/features/more/moreRoutes';

import { styles } from './SituationScreen.styles';

/** „Moja sytuacja się zmieniła” — delikatne ścieżki: strata albo nowe dziecko / ciąża. */
export function SituationScreen() {
  return (
    <ScreenLayout
      title="Moja sytuacja się zmieniła"
      subtitle="Wybierz, co się wydarzyło. Niczego nie zmienimy bez Twojego potwierdzenia."
      onBack={() => router.dismissTo(moreRoutes.home)}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        <LinkRow
          icon={HeartCrack}
          tone="accent"
          title="Straciłam ciążę lub dziecko"
          subtitle="Tryb wsparcia: bez odliczania, tylko to, co ważne"
          onPress={() => router.push(moreRoutes.loss)}
        />
        <LinkRow
          icon={Baby}
          title="Przyjęliśmy dziecko / nowa ciąża"
          subtitle="Zaktualizuj profil dziecka"
          onPress={() => router.push(moreRoutes.children)}
        />
      </View>
    </ScreenLayout>
  );
}
