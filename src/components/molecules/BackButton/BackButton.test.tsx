import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/testing/renderWithProviders';

import { BackButton } from './BackButton';

describe('BackButton', () => {
  it('domyślnie podpisany „Wróć” i wywołuje onPress', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(<BackButton onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'Wróć' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('może mieć własny podpis', async () => {
    await renderWithProviders(<BackButton onPress={jest.fn()} label="W ciąży" />);
    expect(screen.getByRole('button', { name: 'W ciąży' })).toBeOnTheScreen();
  });
});
