import { render, screen, userEvent } from '@testing-library/react-native';

import { PayerStep } from './PayerStep';

describe('PayerStep', () => {
  it('pyta o wielkość płatnika i pokazuje trzy opcje radio', async () => {
    await render(<PayerStep selected={null} onSelect={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Ile osób zatrudnia Twój pracodawca (płatnik)?' })).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('zaznacza tylko wybraną odpowiedź', async () => {
    await render(<PayerStep selected="maly" onSelect={jest.fn()} />);

    expect(screen.getByRole('radio', { name: /20 osób lub mniej/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /21 osób lub więcej/ })).not.toBeChecked();
  });

  it('dotknięcie karty przekazuje wielkość płatnika', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    await render(<PayerStep selected={null} onSelect={onSelect} />);

    await user.press(screen.getByRole('radio', { name: /Nie wiem/ }));

    expect(onSelect).toHaveBeenCalledWith('niewiem');
  });
});
