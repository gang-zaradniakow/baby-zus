import { screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { renderWithProviders } from '@/testing/renderWithProviders';

import { NumberField } from './NumberField';

function Controlled({ onValue }: { onValue: (v: number) => void }) {
  const [value, setValue] = useState(0);
  return (
    <NumberField
      label="Podstawa"
      unit="zł"
      value={value}
      onChange={(v) => {
        setValue(v);
        onValue(v);
      }}
    />
  );
}

describe('NumberField', () => {
  it('przyjmuje przecinek dziesiętny i oddaje liczbę', async () => {
    const onValue = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(<Controlled onValue={onValue} />);

    await user.type(screen.getByLabelText('Podstawa'), '4147,1');

    expect(screen.getByLabelText('Podstawa')).toHaveDisplayValue('4147,1');
    expect(onValue).toHaveBeenLastCalledWith(4147.1);
    expect(screen.getByText('zł')).toBeOnTheScreen();
  });

  it('pokazuje wartość ustawioną z zewnątrz', async () => {
    await renderWithProviders(<NumberField label="Dni" value={60} onChange={jest.fn()} integer />);
    expect(screen.getByLabelText('Dni')).toHaveDisplayValue('60');
  });
});
