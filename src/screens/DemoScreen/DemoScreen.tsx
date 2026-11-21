import { router } from 'expo-router';
import { PenLine, RotateCcw, UserRound } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Card } from '@/components/atoms/Card';
import { LinkRow } from '@/components/molecules/LinkRow';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { PERSONAS } from '@/data/demo/personas';
import { MoreSection } from '@/features/more/components/MoreSection';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useToday } from '@/hooks/useToday';
import { useSession } from '@/session';

import { styles } from './DemoScreen.styles';

/** Panel demo (dla jury): wybór przykładowej osoby, własna ankieta, reset prototypu. */
export function DemoScreen() {
  const today = useToday();
  const { personaId, applyPersona, resetProfile, signOut } = useSession();

  return (
    <ScreenLayout
      title="Panel demo"
      subtitle="Tylko do prezentacji — dane fikcyjne."
      onBack={() => router.dismissTo(moreRoutes.home)}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        <Card tone="accent">
          <AppText variant="caption">
            Wybór osoby podmienia profil i dane z eZUS (symulacja logowania). W produkcji te dane przychodzą z rejestrów i
            eZUS.
          </AppText>
        </Card>

        <MoreSection title="Przykładowe osoby">
          {PERSONAS.map((persona) => (
            <LinkRow
              key={persona.id}
              icon={UserRound}
              tone={persona.id === personaId ? 'primary' : 'neutral'}
              title={persona.id === personaId ? `${persona.label} (wybrana)` : persona.label}
              subtitle={persona.description}
              onPress={() => {
                applyPersona(persona.id, persona.profile(today));
                router.navigate('/');
              }}
            />
          ))}
        </MoreSection>

        <MoreSection title="Inne">
          <LinkRow
            icon={PenLine}
            title="Własna ankieta"
            subtitle="Wypełnij ankietę od nowa"
            onPress={() => {
              resetProfile();
              router.push('/onboarding');
            }}
          />
          <LinkRow
            icon={RotateCcw}
            tone="danger"
            title="Resetuj prototyp"
            subtitle="Wylogowuje i czyści profil"
            onPress={() => {
              resetProfile();
              signOut();
              router.navigate('/');
            }}
          />
        </MoreSection>
      </View>
    </ScreenLayout>
  );
}
