import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/testing/renderWithProviders';

import { LinkRow } from './LinkRow';

describe('LinkRow', () => {
  it('pokazuje tytuł i podpis, dotknięcie wywołuje onPress', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(<LinkRow title="Urlop ojcowski" subtitle="2 tygodnie, 100%" onPress={onPress} />);

    expect(screen.getByText('2 tygodnie, 100%')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Urlop ojcowski. 2 tygodnie, 100%' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('link zewnętrzny ma rolę „link”', async () => {
    await renderWithProviders(<LinkRow title="zus.pl" onPress={jest.fn()} role="link" />);
    expect(screen.getByRole('link', { name: 'zus.pl' })).toBeOnTheScreen();
  });
});
