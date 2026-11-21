import { View } from 'react-native';

import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { TextField } from '@/components/molecules/TextField';

import { stepStyles } from './onboardingStep.styles';

type Props = {
  name: string;
  childName: string;
  /** W ciąży nie pytamy o imię dziecka. */
  asksChildName: boolean;
  onChangeName: (name: string) => void;
  onChangeChildName: (childName: string) => void;
};

/** Krok „Imiona”: opcjonalne imię rodzica i dziecka — tylko do personalizacji tekstów. */
export function NamesStep({ name, childName, asksChildName, onChangeName, onChangeChildName }: Props) {
  return (
    <View>
      <ScreenHeader title="Jak masz na imię?" subtitle="Nie musisz podawać — możesz od razu zakończyć." />
      <View style={stepStyles.options}>
        <TextField label="Twoje imię" value={name} onChangeText={onChangeName} autoComplete="given-name" />
        {asksChildName ? (
          <TextField label="Imię dziecka" value={childName} onChangeText={onChangeChildName} />
        ) : null}
      </View>
    </View>
  );
}
