import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { lightColors } from '@/theme';

import { DateField } from './DateField';

const LABEL = 'Data porodu';

/** DateField jest kontrolowany — w teście trzymamy wartość w stanie, jak robi to formularz. */
function ControlledDateField({ error, hint }: { error?: string | null; hint?: string }) {
  const [value, setValue] = useState('');
  return <DateField label={LABEL} value={value} onChangeText={setValue} error={error} hint={hint} />;
}

describe('DateField', () => {
  it('pole jest opisane etykietą', async () => {
    await render(<ControlledDateField />);
    expect(screen.getByLabelText(LABEL)).toBeOnTheScreen();
    expect(screen.getByText(LABEL)).toBeOnTheScreen();
  });

  it('kropki wstawiają się same podczas wpisywania', async () => {
    const user = userEvent.setup();
    await render(<ControlledDateField />);

    await user.type(screen.getByLabelText(LABEL), '12032027');

    expect(screen.getByLabelText(LABEL)).toHaveDisplayValue('12.03.2027');
  });

  it('przekazuje dalej tylko zamaskowany tekst', async () => {
    const onChangeText = jest.fn();
    await render(<DateField label={LABEL} value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByLabelText(LABEL), '1a2/03');

    expect(onChangeText).toHaveBeenCalledWith('12.03');
  });

  it('pokazuje podpowiedź, gdy nie ma błędu', async () => {
    await render(<ControlledDateField hint="Wpisz datę z karty ciąży" />);
    expect(screen.getByText('Wpisz datę z karty ciąży')).toBeOnTheScreen();
  });

  it('błąd zastępuje podpowiedź i barwi ramkę na czerwono', async () => {
    await render(<ControlledDateField hint="Wpisz datę z karty ciąży" error="Nieprawidłowa data" />);

    expect(screen.getByText('Nieprawidłowa data')).toHaveStyle({ color: lightColors.danger });
    expect(screen.queryByText('Wpisz datę z karty ciąży')).not.toBeOnTheScreen();
    expect(screen.getByLabelText(LABEL)).toHaveStyle({ borderColor: lightColors.danger });
  });

  it('ramka zielona podczas edycji, neutralna po wyjściu z pola', async () => {
    await render(<ControlledDateField />);
    const input = screen.getByLabelText(LABEL);

    await fireEvent(input, 'focus');
    expect(input).toHaveStyle({ borderColor: lightColors.primary });

    await fireEvent(input, 'blur');
    expect(input).toHaveStyle({ borderColor: lightColors.border });
  });
});
