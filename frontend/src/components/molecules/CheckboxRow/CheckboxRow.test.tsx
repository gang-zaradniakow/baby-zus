import { render, screen, userEvent } from '@testing-library/react-native';

import { CheckboxRow } from './CheckboxRow';

describe('CheckboxRow', () => {
  it('jest checkboxem z etykietą jako nazwą i stanem zaznaczenia', async () => {
    await render(<CheckboxRow label="Umowa o pracę" checked onToggle={jest.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Umowa o pracę' })).toBeChecked();
  });

  it('niezaznaczony: stan dostępny dla czytnika ekranu', async () => {
    await render(<CheckboxRow label="Umowa o pracę" checked={false} onToggle={jest.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Umowa o pracę' })).not.toBeChecked();
  });

  it('dotknięcie całego wiersza wywołuje onToggle', async () => {
    const onToggle = jest.fn();
    const user = userEvent.setup();
    await render(<CheckboxRow label="Własna firma" checked={false} onToggle={onToggle} />);

    await user.press(screen.getByRole('checkbox', { name: 'Własna firma' }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('pokazuje podpowiedź, gdy jest podana', async () => {
    await render(<CheckboxRow label="Własna firma" hint="JDG, spółka" checked={false} onToggle={jest.fn()} />);
    expect(screen.getByText('JDG, spółka')).toBeOnTheScreen();
  });
});
