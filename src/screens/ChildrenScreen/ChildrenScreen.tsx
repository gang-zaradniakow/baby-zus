import { router } from 'expo-router';
import { Baby, HandHeart, HeartPulse, PenLine } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Card } from '@/components/atoms/Card';
import { IconCircle } from '@/components/atoms/IconCircle';
import { LinkRow } from '@/components/molecules/LinkRow';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { describeStage } from '@/domain/profile/describeStage';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useToday } from '@/hooks/useToday';
import { useSession } from '@/session';
import { useTheme } from '@/theme';

import { styles } from './ChildrenScreen.styles';

const STAGE_ICON = { ciaza: HeartPulse, dziecko: Baby, adopcja: HandHeart } as const;

/**
 * Profil dziecka z ankiety. Profil obsługuje dziś jedno dziecko (w prototypie: kilka profili
 * z przełączaniem) — nowa ciąża albo przyjęcie dziecka = ankieta od nowa.
 */
export function ChildrenScreen() {
  const { colors } = useTheme();
  const today = useToday();
  const { profile, resetProfile } = useSession();

  const retake = () => {
    resetProfile();
    router.push('/onboarding');
  };

  return (
    <ScreenLayout
      title="Profil dziecka"
      onBack={() => router.dismissTo(moreRoutes.home)}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        {profile ? (
          <Card>
            <View style={styles.row}>
              <IconCircle icon={STAGE_ICON[profile.stage]} />
              <View style={styles.texts}>
                <AppText variant="label">{profile.childName ?? (profile.stage === 'ciaza' ? 'Maluszek' : 'Dziecko')}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {describeStage(profile, today)}
                </AppText>
              </View>
            </View>
          </Card>
        ) : (
          <AppText color={colors.textMuted}>Nie ma jeszcze profilu — wypełnij ankietę.</AppText>
        )}
        <LinkRow
          icon={PenLine}
          title={profile ? 'Nowa ciąża lub przyjęte dziecko' : 'Wypełnij ankietę'}
          subtitle="Ankieta od nowa — dopasujemy terminy do nowej sytuacji"
          onPress={retake}
        />
      </View>
    </ScreenLayout>
  );
}
