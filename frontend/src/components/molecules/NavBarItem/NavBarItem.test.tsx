import { render, screen, userEvent } from '@testing-library/react-native';

import { TABS } from '@/navigation/tabs';
import { lightColors } from '@/theme';

import { NavBarItem } from './NavBarItem';

const start = TABS.find((tab) => tab.name === 'index')!;

describe('NavBarItem', () => {
  it('aktywna: zakładka zaznaczona, etykieta w kolorze tonu', async () => {
    await render(<NavBarItem tab={start} isFocused />);

    expect(screen.getByRole('tab', { name: 'Start' })).toBeSelected();
    expect(screen.getByText('Start')).toHaveStyle({ color: lightColors.primary });
  });

  it('nieaktywna: niezaznaczona, szara etykieta', async () => {
    await render(<NavBarItem tab={start} />);

    expect(screen.getByRole('tab', { name: 'Start' })).not.toBeSelected();
    expect(screen.getByText('Start')).toHaveStyle({ color: lightColors.navInactive });
  });

  it('dotknięcie przekazuje onPress od TabTrigger', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(<NavBarItem tab={start} onPress={onPress} />);

    await user.press(screen.getByRole('tab', { name: 'Start' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
