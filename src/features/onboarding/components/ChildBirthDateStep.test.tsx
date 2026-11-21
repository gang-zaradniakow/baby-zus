import { render, screen, userEvent } from '@testing-library/react-native';

import { ChildBirthDateStep } from './ChildBirthDateStep';

describe('ChildBirthDateStep', () => {
  it('pyta o datę urodzenia przyjętego dziecka', async () => {
    await render(<ChildBirthDateStep value="" error={null} onChange={jest.fn()} />);

    expect(screen.getByRole('header', { name: 'Kiedy urodziło się dziecko?' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Data urodzenia dziecka')).toBeOnTheScreen();
  });

  it('pokazuje komunikat błędu', async () => {
    await render(<ChildBirthDateStep value="01.12.2030" error="Data urodzenia nie może być z przyszłości." onChange={jest.fn()} />);
    expect(screen.getByText('Data urodzenia nie może być z przyszłości.')).toBeOnTheScreen();
  });

  it('wpisywanie przekazuje zamaskowaną datę', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await render(<ChildBirthDateStep value="" error={null} onChange={onChange} />);

    await user.type(screen.getByLabelText('Data urodzenia dziecka'), '1');

    expect(onChange).toHaveBeenCalledWith('1');
  });
});
