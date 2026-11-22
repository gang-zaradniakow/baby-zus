import { render, screen, userEvent } from '@testing-library/react-native';

import { EmploymentStep } from './EmploymentStep';

describe('EmploymentStep', () => {
  it('pokazuje wszystkie formy zatrudnienia jako checkboxy', async () => {
    await render(<EmploymentStep selected={[]} onToggle={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Forma zatrudnienia' })).toBeOnTheScreen();
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  });

  it('zaznacza wybrane formy (można łączyć kilka)', async () => {
    await render(<EmploymentStep selected={['uop', 'jdg']} onToggle={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Umowa o pracę' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Własna firma (JDG)' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Brak ubezpieczenia' })).not.toBeChecked();
  });

  it('dotknięcie wiersza przekazuje identyfikator formy', async () => {
    const onToggle = jest.fn();
    const user = userEvent.setup();
    await render(<EmploymentStep selected={[]} onToggle={onToggle} />);

    await user.press(screen.getByRole('checkbox', { name: 'Umowa zlecenie' }));

    expect(onToggle).toHaveBeenCalledWith('zlec');
  });
});
