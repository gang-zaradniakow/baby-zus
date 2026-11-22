import { render, screen, userEvent } from '@testing-library/react-native';

import { OnboardingTopBar } from './OnboardingTopBar';

describe('OnboardingTopBar', () => {
  it('pokazuje postęp kreatora', async () => {
    await render(<OnboardingTopBar step={3} total={4} />);
    expect(screen.getByRole('progressbar', { name: 'Krok 3 z 4' })).toBeOnTheScreen();
  });

  it('bez onBack: przycisk „Wróć” ukryty', async () => {
    await render(<OnboardingTopBar step={1} total={4} />);
    expect(screen.queryByRole('button', { name: 'Wróć' })).not.toBeOnTheScreen();
  });

  it('z onBack: dotknięcie „Wróć” cofa krok', async () => {
    const onBack = jest.fn();
    const user = userEvent.setup();
    await render(<OnboardingTopBar step={2} total={4} onBack={onBack} />);

    await user.press(screen.getByRole('button', { name: 'Wróć' }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
