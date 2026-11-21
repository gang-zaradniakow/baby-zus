import { router, useLocalSearchParams } from 'expo-router';
import { FileSearch } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { TextButton } from '@/components/atoms/TextButton';
import { Accordion } from '@/components/molecules/Accordion';
import { LinkRow } from '@/components/molecules/LinkRow';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { BenefitResult } from '@/features/calculator/components/BenefitResult';
import { ChildFields } from '@/features/calculator/components/ChildFields';
import { FatherPlanFields } from '@/features/calculator/components/FatherPlanFields';
import { MoreOptionsFields } from '@/features/calculator/components/MoreOptionsFields';
import { PersonFormCard } from '@/features/calculator/components/PersonFormCard';
import { PregnancyFields } from '@/features/calculator/components/PregnancyFields';
import { PregnancyResult } from '@/features/calculator/components/PregnancyResult';
import { SituationPicker } from '@/features/calculator/components/SituationPicker';
import { VariantPicker } from '@/features/calculator/components/VariantPicker';
import { situationFromParam } from '@/features/calculator/situationParam';
import { useCalculatorForm } from '@/features/calculator/useCalculatorForm';
import { useSession } from '@/session';

import { styles } from './CalculatorScreen.styles';

/** Zakładka „Kalkulator”: zintegrowany kalkulator zasiłku (L4 w ciąży, poród, adopcja) — jak w prototypie. */
export function CalculatorScreen() {
  const { profile } = useSession();
  const { sytuacja } = useLocalSearchParams<{ sytuacja?: string }>();
  const calc = useCalculatorForm(situationFromParam(sytuacja));
  const { form, result } = calc;

  // Zakładka zostaje zamontowana — nowy „Policz” z artykułu zmienia sytuację bez remontu ekranu.
  const [lastParam, setLastParam] = useState(sytuacja);
  if (sytuacja !== lastParam) {
    setLastParam(sytuacja);
    const situation = situationFromParam(sytuacja);
    if (situation) calc.setSituation(situation);
  }

  return (
    <ScreenLayout title="Kalkulator zasiłku" subtitle="Zasiłek chorobowy w ciąży i zasiłek macierzyński — dla obojga rodziców.">
      <View style={styles.content}>
        <SituationPicker selected={form.situation} onSelect={calc.setSituation} />

        {result.kind === 'pregnancy' ? (
          <>
            <PersonFormCard
              title="Mama"
              person={form.mother}
              resolved={result.mother}
              onUpdate={(update) => calc.updatePerson('mother', update)}
            />
            <PregnancyFields
              pregnancy={form.pregnancy}
              employee={form.mother.titles.uop.on}
              onChange={calc.patchPregnancy}
            />
            <PregnancyResult result={result} days={form.pregnancy.days} />
          </>
        ) : (
          <>
            <ChildFields
              form={form}
              onDateText={calc.setDateText}
              onChildrenCount={calc.setChildrenCount}
              onAdoption={calc.patchAdoption}
            />
            <PersonFormCard
              title="Mama"
              person={form.mother}
              resolved={result.mother}
              onUpdate={(update) => calc.updatePerson('mother', update)}
            />
            <VariantPicker value={form.variant} onChange={calc.setVariant} />
            <Accordion title="Tata / drugi rodzic">
              <PersonFormCard
                title="Tata"
                person={form.father}
                resolved={result.father}
                onUpdate={(update) => calc.updatePerson('father', update)}
              />
              {result.father.resolution.title !== 'none' ? (
                <FatherPlanFields
                  plan={form.fatherPlan}
                  maternityWeeks={result.simulation.maternityWeeks}
                  parentalWeeks={result.simulation.parentalWeeks}
                  canTakeOverMaternity={form.situation === 'birth'}
                  onChange={calc.patchFatherPlan}
                />
              ) : null}
            </Accordion>
            <Accordion title="Więcej opcji">
              <MoreOptionsFields
                form={form}
                parentalWeeks={result.simulation.parentalWeeks}
                onZaZyciem={calc.setZaZyciem}
                onPreterm={calc.patchPreterm}
                onAdoption={calc.patchAdoption}
                onWork={calc.patchWork}
              />
            </Accordion>
            <BenefitResult result={result} />
          </>
        )}

        {profile ? <TextButton title="Przywróć dane z ankiety" onPress={calc.reset} /> : null}

        <LinkRow
          icon={FileSearch}
          title="Sprawdź sprawę"
          subtitle="Masz dokumenty z ZUS lub od pracodawcy? Sprawdzimy, czy świadczenie przysługuje"
          onPress={() => router.push('/kalkulator/sprawa')}
        />
      </View>
    </ScreenLayout>
  );
}
