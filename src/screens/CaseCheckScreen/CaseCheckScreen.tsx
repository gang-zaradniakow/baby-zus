import { router } from 'expo-router';
import { Calculator } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { CheckList } from '@/components/molecules/CheckList';
import { DateField } from '@/components/molecules/DateField';
import { NumberField } from '@/components/molecules/NumberField';
import { RadioRow } from '@/components/molecules/RadioRow';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { verifyCase, type CaseKind, type CaseTitle } from '@/domain/caseCheck/verifyCase';
import { formatDate } from '@/domain/dates/formatDate';
import { parsePolishDate } from '@/domain/dates/parsePolishDate';
import { calculatorHref } from '@/features/calculator/situationParam';
import { useToday } from '@/hooks/useToday';
import { useLegalParams } from '@/params';
import { useTheme } from '@/theme';

import { styles } from './CaseCheckScreen.styles';

const KINDS: { value: CaseKind; label: string }[] = [
  { value: 'maternity', label: 'Zasiłek macierzyński (poród)' },
  { value: 'sickness', label: 'Zasiłek chorobowy w ciąży' },
  { value: 'paternity', label: 'Urlop ojcowski' },
  { value: 'parental', label: 'Urlop rodzicielski' },
  { value: 'adoption', label: 'Przyjęcie dziecka na wychowanie' },
];
const TITLES: { value: CaseTitle; label: string }[] = [
  { value: 'uop', label: 'Umowa o pracę' },
  { value: 'zlec', label: 'Umowa zlecenia (chorobowe dobrowolne)' },
  { value: 'jdg', label: 'Działalność gospodarcza (chorobowe dobrowolne)' },
  { value: 'none', label: 'Brak ubezpieczenia chorobowego' },
];
const PAYERS = [
  { value: 'large' as const, label: 'Ponad 20 osób' },
  { value: 'small' as const, label: 'Do 20 osób' },
];

const EVENT_LABEL: Record<CaseKind, string> = {
  maternity: 'Data porodu',
  sickness: 'Pierwszy dzień niezdolności do pracy',
  paternity: 'Data porodu',
  parental: 'Data porodu',
  adoption: 'Data przyjęcia dziecka',
};

/**
 * Sprawdź sprawę (port vSprawa/sprawaOut bez odczytu PDF): dane z dokumentów wpisane ręcznie →
 * weryfikacja ubezpieczenia, okresu wyczekiwania, zaległości i tego, kto wypłaca; przejście do kalkulatora.
 */
export function CaseCheckScreen() {
  const { colors } = useTheme();
  const today = useToday();
  const { params } = useLegalParams();
  const [kind, setKind] = useState<CaseKind>('maternity');
  const [title, setTitle] = useState<CaseTitle>('uop');
  const [insuredFrom, setInsuredFrom] = useState('01.01.2024');
  const [insuredTo, setInsuredTo] = useState('');
  const [eventDate, setEventDate] = useState(formatDate(today));
  const [debt, setDebt] = useState(0);
  const [payer, setPayer] = useState<'large' | 'small'>('large');

  const result = verifyCase(
    {
      kind,
      title,
      insuredFrom: parsePolishDate(insuredFrom),
      insuredTo: insuredTo ? parsePolishDate(insuredTo) : null,
      eventDate: parsePolishDate(eventDate),
      debt,
      largePayer: payer === 'large',
    },
    params,
  );
  const situation = kind === 'sickness' ? 'ciaza' : kind === 'adoption' ? 'adopt' : 'birth';

  return (
    <ScreenLayout
      title="Sprawdź sprawę"
      subtitle="Wpisz dane z dokumentów sprawy — sprawdzimy, czy świadczenie przysługuje."
      onBack={() => router.dismissTo('/kalkulator')}
      backLabel="Kalkulator"
    >
      <View style={styles.content}>
        <Card title="Rodzaj sprawy">
          <View style={styles.options} accessibilityRole="radiogroup">
            {KINDS.map((option) => (
              <RadioRow key={option.value} label={option.label} selected={kind === option.value} onPress={() => setKind(option.value)} />
            ))}
          </View>
        </Card>

        <Card title="Tytuł ubezpieczenia">
          <View style={styles.options} accessibilityRole="radiogroup">
            {TITLES.map((option) => (
              <RadioRow key={option.value} label={option.label} selected={title === option.value} onPress={() => setTitle(option.value)} />
            ))}
          </View>
        </Card>

        <Card title="Daty i kwoty">
          <DateField label="Chorobowe od" value={insuredFrom} onChangeText={setInsuredFrom} />
          <DateField label="Chorobowe do (puste = trwa)" value={insuredTo} onChangeText={setInsuredTo} />
          <DateField label={EVENT_LABEL[kind]} value={eventDate} onChangeText={setEventDate} />
          {title === 'jdg' ? (
            <NumberField label="Zadłużenie składkowe na dzień powstania prawa" unit="zł" value={debt} onChange={setDebt} />
          ) : null}
          {title === 'uop' || title === 'zlec' ? (
            <SegmentedControl label="Płatnik składek (stan na 30.11)" options={PAYERS} value={payer} onChange={setPayer} />
          ) : null}
        </Card>

        <AppText variant="cardTitle">Weryfikacja</AppText>
        <CheckList checks={result.checks} />
        <Card tone={result.eligible ? 'primary' : 'danger'}>
          <AppText variant="label" color={result.eligible ? colors.textPrimary : colors.danger}>
            {result.eligible
              ? 'Świadczenie przysługuje — przelicz wysokość i okres.'
              : 'Świadczenie nie przysługuje lub jest wstrzymane.'}
          </AppText>
        </Card>
        {result.insured ? (
          <Button
            title="Przelicz w kalkulatorze zasiłków"
            icon={Calculator}
            onPress={() => router.navigate(calculatorHref(situation))}
          />
        ) : null}
      </View>
    </ScreenLayout>
  );
}
