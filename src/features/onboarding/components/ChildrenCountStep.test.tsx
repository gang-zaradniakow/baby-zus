import { render, screen, userEvent } from '@testing-library/react-native';

import { ChildrenCountStep } from './ChildrenCountStep';

describe('ChildrenCountStep', () => {
  it('pyta o liczbę dzieci i pokazuje trzy opcje radio', async () => {
    await render(<ChildrenCountStep selected={null} onSelect={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Ile dzieci?' })).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('zaznacza tylko wybraną odpowiedź', async () => {
    await render(<ChildrenCountStep selected={2} onSelect={jest.fn()} />);

    expect(screen.getByRole('radio', { name: /Bliźnięta/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Jedno/ })).not.toBeChecked();
  });

  it('dotknięcie karty przekazuje liczbę dzieci', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    await render(<ChildrenCountStep selected={null} onSelect={onSelect} />);

    await user.press(screen.getByRole('radio', { name: /Trojaczki/ }));

    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
