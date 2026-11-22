import { screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { renderWithProviders } from '@/testing/renderWithProviders';

import { SearchField } from './SearchField';

function Controlled() {
  const [value, setValue] = useState('');
  return <SearchField label="Szukaj w poradniku" value={value} onChangeText={setValue} />;
}

describe('SearchField', () => {
  it('pole opisane etykietą przyjmuje tekst', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Controlled />);

    await user.type(screen.getByLabelText('Szukaj w poradniku'), 'kod B');

    expect(screen.getByLabelText('Szukaj w poradniku')).toHaveDisplayValue('kod B');
  });
});
