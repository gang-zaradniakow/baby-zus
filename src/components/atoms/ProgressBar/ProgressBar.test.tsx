import { render, screen } from '@testing-library/react-native';

import { lightColors } from '@/theme';

import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('czytnik ekranu słyszy numer kroku i zakres', async () => {
    await render(<ProgressBar total={4} current={2} />);

    const bar = screen.getByRole('progressbar', { name: 'Krok 2 z 4' });
    expect(bar).toHaveAccessibilityValue({ min: 1, max: 4, now: 2 });
  });

  it('jeden segment na krok — ukończone i bieżący w kolorze głównym', async () => {
    await render(<ProgressBar total={4} current={2} />);

    const segments = screen.getByRole('progressbar').children;
    expect(segments).toHaveLength(4);
    expect(segments[0]).toHaveStyle({ backgroundColor: lightColors.primary });
    expect(segments[1]).toHaveStyle({ backgroundColor: lightColors.primary });
    expect(segments[2]).toHaveStyle({ backgroundColor: lightColors.track });
    expect(segments[3]).toHaveStyle({ backgroundColor: lightColors.track });
  });
});
