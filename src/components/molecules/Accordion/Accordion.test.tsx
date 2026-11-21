import { screen, userEvent } from '@testing-library/react-native';

import { AppText } from '@/components/atoms/AppText';
import { renderWithProviders } from '@/testing/renderWithProviders';

import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('domyślnie zwinięta, dotknięcie rozwija treść', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <Accordion title="Więcej opcji">
        <AppText>Treść sekcji</AppText>
      </Accordion>,
    );

    expect(screen.queryByText('Treść sekcji')).not.toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Więcej opcji' }));

    expect(screen.getByText('Treść sekcji')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Więcej opcji' })).toBeExpanded();
  });
});
