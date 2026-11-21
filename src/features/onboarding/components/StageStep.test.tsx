import { render, screen, userEvent } from '@testing-library/react-native';

import { StageStep } from './StageStep';

describe('StageStep', () => {
  it('pyta o etap i pokazuje trzy opcje radio', async () => {
    await render(<StageStep selected={null} onSelect={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Na jakim etapie teraz jesteś?' })).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('zaznacza tylko wybraną opcję', async () => {
    await render(<StageStep selected="dziecko" onSelect={jest.fn()} />);

    expect(screen.getByRole('radio', { name: /Maluch jest na świecie/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Jestem w ciąży/ })).not.toBeChecked();
  });

  it('dotknięcie karty przekazuje identyfikator etapu', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    await render(<StageStep selected={null} onSelect={onSelect} />);

    await user.press(screen.getByRole('radio', { name: /Przyjęliśmy dziecko/ }));

    expect(onSelect).toHaveBeenCalledWith('adopcja');
  });
});
