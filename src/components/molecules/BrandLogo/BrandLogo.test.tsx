import { render, screen } from '@testing-library/react-native';

import { lightColors } from '@/theme';

import { BrandLogo } from './BrandLogo';

describe('BrandLogo', () => {
  it('czytnik ekranu widzi jeden obrazek z pełną nazwą', async () => {
    await render(<BrandLogo />);
    expect(screen.getByRole('image', { name: 'mZUS dla Rodzica' })).toBeOnTheScreen();
  });

  it('znak w kolorze głównym, dopisek w kolorze akcentu', async () => {
    await render(<BrandLogo />);
    expect(screen.getByText('mZUS')).toHaveStyle({ color: lightColors.primary });
    expect(screen.getByText('dla Rodzica.')).toHaveStyle({ color: lightColors.accent });
  });
});
