import { router } from 'expo-router';
import { HeartHandshake, Info, LogIn, LogOut, PenLine, Settings, Video } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { AppText } from '@/components/atoms/AppText';
import { LinkRow } from '@/components/molecules/LinkRow';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { MoreSection } from '@/features/more/components/MoreSection';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useSession } from '@/session';
import { useTheme } from '@/theme';

import { styles } from './MoreScreen.styles';

/** Zakładka „Więcej” jako hub: konto, moja sytuacja, pomoc, informacje — jak `vMore` w prototypie. */
export function MoreScreen() {
  const { colors } = useTheme();
  const { isSignedIn, profile, signOut, resetProfile } = useSession();

  const retakeSurvey = () => {
    resetProfile();
    router.push('/onboarding');
  };

  return (
    <ScreenLayout title="Więcej" subtitle="Konto, pomoc i informacje o aplikacji.">
      <View style={styles.content}>
        {isSignedIn ? (
          <Card>
            <AppText variant="label">{profile?.name ?? 'Twoje konto'}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Zalogowano przez mObywatel (symulacja) · PESEL ukryty
            </AppText>
          </Card>
        ) : (
          <>
            <Button title="Zaloguj przez mObywatel" variant="mobywatel" icon={LogIn} onPress={() => router.push('/login')} />
            <MoreSection title="Moja sytuacja">
              <LinkRow
                icon={PenLine}
                title={profile ? 'Zmień odpowiedzi' : 'Wypełnij ankietę'}
                subtitle="Kilka pytań — dopasujemy terminy i świadczenia"
                onPress={retakeSurvey}
              />
            </MoreSection>
          </>
        )}

        <MoreSection title="Pomoc">
          <LinkRow
            icon={Video}
            title="e-Wizyta i mama@zus.pl"
            subtitle="Rozmowa wideo, e-mail dla rodziców, infolinia"
            onPress={() => router.push(moreRoutes.contact)}
          />
          <LinkRow
            icon={HeartHandshake}
            tone="accent"
            title="Wsparcie i organizacje"
            subtitle="Fundacje, telefony wsparcia, strony ZUS, MRPiPS i PIP"
            onPress={() => router.push(moreRoutes.support)}
          />
        </MoreSection>

        <MoreSection title="Ustawienia">
          <LinkRow
            icon={Settings}
            title="Wygląd"
            subtitle="Motyw jasny / ciemny, rozmiar tekstu"
            onPress={() => router.push(moreRoutes.settings)}
          />
        </MoreSection>

        <MoreSection title="Informacje">
          <LinkRow
            icon={Info}
            title="O aplikacji"
            subtitle="Prototyp, zakres, stan prawny"
            onPress={() => router.push(moreRoutes.about)}
          />
        </MoreSection>

        {isSignedIn ? (
          <Button title="Wyloguj" variant="secondary" icon={LogOut} onPress={signOut} />
        ) : (
          <Button title="Usuń moje odpowiedzi i zacznij od nowa" variant="secondary" icon={LogOut} onPress={resetProfile} />
        )}
      </View>
    </ScreenLayout>
  );
}
