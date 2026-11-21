import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/testing/renderWithProviders';

import { ToggleChip } from './ToggleChip';

describe('ToggleChip', () => {
  it('stan zaznaczenia i dotknięcie', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(<ToggleChip label="Etat" selected onPress={onPress} />);

    expect(screen.getByRole('checkbox', { name: 'Etat' })).toBeChecked();
    await user.press(screen.getByRole('checkbox', { name: 'Etat' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('bez `selected` — zwykły przycisk-podpowiedź', async () => {
    await renderWithProviders(<ToggleChip label="Ile trwa urlop?" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Ile trwa urlop?' })).toBeOnTheScreen();
  });
});
