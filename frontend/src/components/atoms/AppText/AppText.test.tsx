import { render, screen } from '@testing-library/react-native';

import { lightColors, typography } from '@/theme';

import { AppText } from './AppText';

describe('AppText', () => {
  it('wyświetla przekazany tekst', async () => {
    await render(<AppText>Oś czasu</AppText>);
    expect(screen.getByText('Oś czasu')).toBeOnTheScreen();
  });

  it('domyślnie używa wariantu body i koloru tekstu z motywu', async () => {
    await render(<AppText>Treść</AppText>);
    expect(screen.getByText('Treść')).toHaveStyle({
      fontSize: typography.body.fontSize,
      color: lightColors.textPrimary,
    });
  });

  it('stosuje wybrany wariant i nadpisany kolor', async () => {
    await render(
      <AppText variant="title" color="#123456">
        Tytuł
      </AppText>,
    );
    expect(screen.getByText('Tytuł')).toHaveStyle({ fontSize: typography.title.fontSize, color: '#123456' });
  });
});
