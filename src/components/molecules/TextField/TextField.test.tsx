import { render, screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { TextField } from './TextField';

const LABEL = 'Twoje imię';

/** TextField jest kontrolowany — w teście trzymamy wartość w stanie, jak robi to formularz. */
function ControlledTextField({ hint }: { hint?: string }) {
  const [value, setValue] = useState('');
  return <TextField label={LABEL} value={value} onChangeText={setValue} hint={hint} />;
}

describe('TextField', () => {
  it('pole jest opisane etykietą', async () => {
    await render(<ControlledTextField />);
    expect(screen.getByLabelText(LABEL)).toBeOnTheScreen();
    expect(screen.getByText(LABEL)).toBeOnTheScreen();
  });

  it('wpisany tekst trafia do pola', async () => {
    const user = userEvent.setup();
    await render(<ControlledTextField />);

    await user.type(screen.getByLabelText(LABEL), 'Ania');

    expect(screen.getByLabelText(LABEL)).toHaveDisplayValue('Ania');
  });

  it('pokazuje podpowiedź pod polem', async () => {
    await render(<ControlledTextField hint="Nie musisz podawać." />);
    expect(screen.getByText('Nie musisz podawać.')).toBeOnTheScreen();
  });
});
