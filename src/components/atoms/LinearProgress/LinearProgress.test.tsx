import { render, screen } from '@testing-library/react-native';

import { lightColors } from '@/theme';

import { LinearProgress } from './LinearProgress';

describe('LinearProgress', () => {
  it('wypełnia pasek proporcjonalnie do postępu', async () => {
    await render(<LinearProgress progress={0.42} accessibilityLabel="Ładowanie" />);
    expect(screen.getByTestId('linear-progress-fill')).toHaveStyle({ width: '42%', backgroundColor: lightColors.primary });
    expect(screen.getByRole('progressbar', { name: 'Ładowanie' })).toHaveAccessibilityValue({ now: 42 });
  });

  it('przycina wartości spoza zakresu 0–1', async () => {
    await render(<LinearProgress progress={1.7} accessibilityLabel="Ładowanie" />);
    expect(screen.getByTestId('linear-progress-fill')).toHaveStyle({ width: '100%' });
  });
});
