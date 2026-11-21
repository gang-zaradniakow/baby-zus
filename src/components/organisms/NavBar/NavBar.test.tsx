import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { lightColors, spacing } from '@/theme';

import { NavBar } from './NavBar';

describe('NavBar', () => {
  it('renderuje przekazane przyciski zakładek', async () => {
    await render(
      <NavBar>
        <Text>Start</Text>
        <Text>Więcej</Text>
      </NavBar>,
    );

    expect(screen.getByText('Start')).toBeOnTheScreen();
    expect(screen.getByText('Więcej')).toBeOnTheScreen();
  });

  it('ma rolę tablist, kolory paska z motywu i minimalny margines dolny', async () => {
    // Atrapa safe-area zwraca zerowe marginesy, więc działa minimum `spacing.sm`.
    await render(<NavBar testID="navbar" />);

    const bar = screen.getByTestId('navbar');
    expect(bar).toHaveProp('accessibilityRole', 'tablist');
    expect(bar).toHaveStyle({
      backgroundColor: lightColors.navBackground,
      borderTopColor: lightColors.navBorder,
      paddingBottom: spacing.sm,
    });
  });
});
