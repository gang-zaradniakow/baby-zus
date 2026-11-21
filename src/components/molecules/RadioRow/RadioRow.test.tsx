import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/testing/renderWithProviders';

import { RadioRow } from './RadioRow';

describe('RadioRow', () => {
  it('etykieta z podpowiedzią, stan wyboru i dotknięcie', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(<RadioRow label="Jednorazowo" hint="14 dni" selected onPress={onPress} />);

    expect(screen.getByRole('radio', { name: 'Jednorazowo. 14 dni' })).toBeChecked();
    await user.press(screen.getByRole('radio', { name: 'Jednorazowo. 14 dni' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
