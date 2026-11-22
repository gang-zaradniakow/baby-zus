import { router } from 'expo-router';
import { PenLine } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Accordion } from '@/components/molecules/Accordion';
import { LinkRow } from '@/components/molecules/LinkRow';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { WIZARDS } from '@/data/wizards';
import { createWizardContext } from '@/domain/wizards/createWizardContext';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useFormsGlossary } from '@/features/wizards/useFormsGlossary';
import { useToday } from '@/hooks/useToday';
import { useSession } from '@/session';

import { styles } from './WizardListScreen.styles';

const DESTINATION = { PRAC: 'pismo do pracodawcy', ZUS: 'wniosek do ZUS', USC: 'wniosek do USC' } as const;

/** Wnioski i pisma: lista kreatorów (z miejscem docelowym) i słowniczek formularzy ZUS. */
export function WizardListScreen() {
  const today = useToday();
  const { profile } = useSession();
  const ctx = createWizardContext(profile, today);
  const forms = useFormsGlossary();

  return (
    <ScreenLayout
      title="Wnioski i pisma"
      subtitle="Jedno pytanie na ekran — na końcu gotowe pismo albo wniosek."
      onBack={() => router.dismissTo(moreRoutes.home)}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        <View style={styles.list}>
          {WIZARDS.map((wizard) => (
            <LinkRow
              key={wizard.id}
              icon={PenLine}
              title={wizard.title}
              subtitle={`${wizard.short} · ${DESTINATION[wizard.institution(ctx)]}`}
              onPress={() => router.push(moreRoutes.wizard(wizard.id))}
            />
          ))}
        </View>
        <Accordion title="Słowniczek formularzy">
          {forms.map((form) => (
            <View key={form.code}>
              <AppText variant="label">{form.code}</AppText>
              <AppText variant="caption">{form.description}</AppText>
            </View>
          ))}
        </Accordion>
      </View>
    </ScreenLayout>
  );
}
