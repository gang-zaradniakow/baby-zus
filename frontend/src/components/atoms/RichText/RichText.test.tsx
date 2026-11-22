import { render, screen } from '@testing-library/react-native';

import { typography } from '@/theme';

import { RichText } from './RichText';

describe('RichText', () => {
  it('pokazuje cały tekst bez znaczników', async () => {
    await render(<RichText text="Płatnik **21 osób** wypłaca sam." />);
    expect(screen.getByText('Płatnik 21 osób wypłaca sam.')).toBeOnTheScreen();
  });

  it('pogrubia fragment w gwiazdkach', async () => {
    await render(<RichText text="Płatnik **21 osób** wypłaca sam." />);
    expect(screen.getByText('21 osób')).toHaveStyle(typography.strong);
  });
});
