import { render, screen, userEvent } from '@testing-library/react-native';
import { LogIn } from 'lucide-react-native';

import { lightColors } from '@/theme';

import { Button } from './Button';

describe('Button', () => {
  it('jest dostępnym przyciskiem z tytułem jako nazwą', async () => {
    await render(<Button title="Zaloguj" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Zaloguj' })).toBeEnabled();
  });

  it('wywołuje onPress po dotknięciu', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button title="Dalej" onPress={onPress} />);

    await user.press(screen.getByRole('button', { name: 'Dalej' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('pokazuje ikonę w kolorze tekstu wariantu', async () => {
    await render(<Button title="Zaloguj" onPress={jest.fn()} icon={LogIn} />);
    expect(screen.getByTestId('icon-LogIn')).toHaveProp('accessibilityHint', lightColors.onPrimary);
  });

  it('wyłączony: nie reaguje na dotknięcie', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button title="Dalej" onPress={onPress} disabled />);

    const button = screen.getByRole('button', { name: 'Dalej' });
    await user.press(button);

    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });

  it('ładowanie: kręciołek zamiast tytułu, przycisk zajęty i zablokowany', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<Button title="Zaloguj" onPress={onPress} loading />);

    const button = screen.getByRole('button', { name: 'Zaloguj' });
    await user.press(button);

    expect(screen.queryByText('Zaloguj')).not.toBeOnTheScreen();
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });
});
