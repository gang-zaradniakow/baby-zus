import { render, screen, userEvent } from '@testing-library/react-native';

import { PartnerStep } from './PartnerStep';

describe('PartnerStep', () => {
  it('pyta o drugiego rodzica i pokazuje trzy opcje radio', async () => {
    await render(<PartnerStep selected={null} onSelect={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Drugi rodzic' })).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('zaznacza tylko wybraną odpowiedź', async () => {
    await render(<PartnerStep selected="notrack" onSelect={jest.fn()} />);

    expect(screen.getByRole('radio', { name: /Pokazuj tylko moje/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Pokaż też jego\/jej uprawnienia/ })).not.toBeChecked();
  });

  it('dotknięcie karty przekazuje wybraną odpowiedź', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    await render(<PartnerStep selected={null} onSelect={onSelect} />);

    await user.press(screen.getByRole('radio', { name: /Wychowuję dziecko sama/ }));

    expect(onSelect).toHaveBeenCalledWith('single');
  });
});
