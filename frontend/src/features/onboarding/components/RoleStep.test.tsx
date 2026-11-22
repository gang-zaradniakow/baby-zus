import { render, screen, userEvent } from '@testing-library/react-native';

import { RoleStep } from './RoleStep';

describe('RoleStep', () => {
  it('pyta o rolę i pokazuje trzy opcje radio', async () => {
    await render(<RoleStep selected={null} onSelect={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Kim jesteś dla dziecka?' })).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('zaznacza tylko wybraną rolę', async () => {
    await render(<RoleStep selected="tata" onSelect={jest.fn()} />);

    expect(screen.getByRole('radio', { name: /Tatą/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Mamą/ })).not.toBeChecked();
  });

  it('dotknięcie karty przekazuje identyfikator roli', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    await render(<RoleStep selected={null} onSelect={onSelect} />);

    await user.press(screen.getByRole('radio', { name: /Opiekunem/ }));

    expect(onSelect).toHaveBeenCalledWith('opiekun');
  });
});
