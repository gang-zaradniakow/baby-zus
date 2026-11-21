import { render, screen, userEvent } from '@testing-library/react-native';

import { SpecialSituationsStep } from './SpecialSituationsStep';

describe('SpecialSituationsStep', () => {
  it('pokazuje trzy opcjonalne sytuacje', async () => {
    await render(<SpecialSituationsStep selected={[]} onToggle={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Sytuacje szczególne' })).toBeOnTheScreen();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('zaznacza wybrane sytuacje', async () => {
    await render(<SpecialSituationsStep selected={['single']} onToggle={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Samodzielne wychowywanie' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Jeden z rodziców pracuje za granicą (UE)' })).not.toBeChecked();
  });

  it('dotknięcie wiersza przekazuje identyfikator sytuacji', async () => {
    const onToggle = jest.fn();
    const user = userEvent.setup();
    await render(<SpecialSituationsStep selected={[]} onToggle={onToggle} />);

    await user.press(screen.getByRole('checkbox', { name: 'Dziecko z orzeczeniem o niepełnosprawności' }));

    expect(onToggle).toHaveBeenCalledWith('disability');
  });
});
