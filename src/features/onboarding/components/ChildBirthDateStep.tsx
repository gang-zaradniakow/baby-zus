import { View } from 'react-native';

import { DateField } from '@/components/molecules/DateField';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';

type Props = {
  value: string;
  error: string | null;
  onChange: (text: string) => void;
};

/** Krok „Data urodzenia” — tylko przy adopcji; od wieku dziecka zależy długość urlopu. */
export function ChildBirthDateStep({ value, error, onChange }: Props) {
  return (
    <View>
      <ScreenHeader
        title="Kiedy urodziło się dziecko?"
        subtitle="Przy adopcji długość urlopu zależy od wieku dziecka."
      />
      <DateField label="Data urodzenia dziecka" hint="Np. 05.09.2022" value={value} error={error} onChangeText={onChange} />
    </View>
  );
}
