import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { ProgressBar } from '@/components/atoms/ProgressBar';
import { BackButton } from '@/components/molecules/BackButton';
import { LinkRow } from '@/components/molecules/LinkRow';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { StepLayout } from '@/components/templates/StepLayout';
import { findWizard } from '@/data/wizards';
import { describeAnswer } from '@/domain/wizards/describeAnswer';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { LoginRequired } from '@/features/more/components/LoginRequired';
import { moreRoutes } from '@/features/more/moreRoutes';
import { InstitutionBadge } from '@/features/wizards/components/InstitutionBadge';
import { styles } from '@/features/wizards/components/wizard.styles';
import { WizardStepInput } from '@/features/wizards/components/WizardStepInput';
import { useWizardForm } from '@/features/wizards/useWizardForm';
import { useSession } from '@/session';
import { useTheme } from '@/theme';

/** Kreator wniosku (port vWizard): wstęp → pytania → „Sprawdź i zatwierdź” → pismo albo wniosek. */
export function WizardScreen() {
  const { wizardId } = useLocalSearchParams<{ wizardId: string }>();
  const definition = findWizard(wizardId);

  if (!definition) {
    return (
      <ScreenLayout
        title="Nie ma takiego wniosku"
        onBack={() => router.dismissTo(moreRoutes.wizards)}
        backLabel="Wnioski i pisma"
      />
    );
  }
  return <WizardFlow definition={definition} />;
}

function WizardFlow({ definition }: { definition: WizardDefinition }) {
  const { colors } = useTheme();
  const { isSignedIn } = useSession();
  const wizard = useWizardForm(definition);
  const exit = () => router.dismissTo(moreRoutes.wizards);
  const back = () => {
    if (!wizard.back()) exit();
  };
  // Szkic nie trafia do urzędu, więc nie wymaga logowania nawet przy wniosku do ZUS.
  const online = !definition.draft && wizard.institution !== 'PRAC';

  // Wnioski przez eZUS / gov.pl wymagają zalogowania (pisma do pracodawcy — nie).
  if (online && !isSignedIn) {
    return (
      <ScreenLayout title={definition.title} onBack={exit} backLabel="Wnioski i pisma">
        <LoginRequired reason="Ten wniosek trafia do urzędu przez internet (eZUS / gov.pl) — potrzebne jest logowanie." />
      </ScreenLayout>
    );
  }

  if (wizard.stage === 'intro') {
    return (
      <ScreenLayout title={definition.title} onBack={exit} backLabel="Wnioski i pisma">
        <View style={styles.content}>
          <View style={styles.footer}>
            <InstitutionBadge institution={wizard.institution} />
          </View>
          <AppText>{definition.intro}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {definition.draft
              ? 'Wynik: szkic wniosku w Moich dokumentach — złożysz go po porodzie.'
              : online
                ? 'Wynik: wniosek przez internet (symulacja, z numerem UPO).'
                : 'Wynik: pismo do pracodawcy — do wydruku albo wysłania do kadr.'}
          </AppText>
          <Button title="Zaczynamy" onPress={wizard.start} />
        </View>
      </ScreenLayout>
    );
  }

  const isReview = wizard.stage === 'review';
  const total = wizard.steps.length + 1;

  const finish = () => {
    const document = wizard.submit();
    router.replace(moreRoutes.result(document.id));
  };

  return (
    <StepLayout
      header={
        <View style={styles.topBar}>
          <BackButton onPress={back} label="Wstecz" />
          <ProgressBar total={total} current={isReview ? total : wizard.stepNumber} />
        </View>
      }
      footer={
        isReview ? (
          <Button
            title={definition.draft ? 'Zapisz szkic' : online ? 'Wyślij (symulacja)' : 'Utwórz pismo'}
            onPress={finish}
          />
        ) : (
          <Button title="Dalej" onPress={wizard.next} />
        )
      }
    >
      <View style={styles.content}>
        <ScreenHeader
          title={isReview ? 'Sprawdź i zatwierdź' : wizard.step.question}
          subtitle={isReview ? definition.title : wizard.step.hint}
        />
        {isReview ? (
          <View style={styles.options}>
            {wizard.steps.map((step, i) =>
              step.kind === 'info' ? null : (
                <LinkRow
                  key={step.id}
                  title={describeAnswer(step, wizard.answers)}
                  subtitle={`${step.question} · Zmień`}
                  onPress={() => wizard.jumpTo(i)}
                />
              ),
            )}
          </View>
        ) : (
          <WizardStepInput step={wizard.step} answers={wizard.answers} ctx={wizard.ctx} onChange={wizard.setAnswer} />
        )}
        {wizard.issue ? (
          <Card tone={wizard.issue.level === 'error' ? 'danger' : 'accent'}>
            <AppText color={wizard.issue.level === 'error' ? colors.danger : colors.textPrimary} accessibilityLiveRegion="polite">
              {wizard.issue.text}
            </AppText>
            {wizard.issue.level === 'warning' ? (
              <AppText variant="caption">Możesz przejść dalej — naciśnij „Dalej” jeszcze raz.</AppText>
            ) : null}
          </Card>
        ) : null}
      </View>
    </StepLayout>
  );
}
