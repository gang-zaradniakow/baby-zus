import { render, screen } from '@testing-library/react-native';

import { lightColors } from '@/theme';

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('zaznaczony: ptaszek i wypełnienie kolorem głównym', async () => {
    await render(<Checkbox checked />);

    const check = screen.getByTestId('icon-Check');
    expect(check).toHaveProp('accessibilityHint', lightColors.onPrimary);
    expect(check.parent).toHaveStyle({
      backgroundColor: lightColors.primary,
      borderColor: lightColors.primary,
    });
  });

  it('niezaznaczony: bez ptaszka', async () => {
    await render(<Checkbox checked={false} />);
    expect(screen.queryByTestId('icon-Check')).not.toBeOnTheScreen();
  });
});
