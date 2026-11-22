import { render, screen } from '@testing-library/react-native';

import { lightColors } from '@/theme';

import { Badge } from './Badge';

describe('Badge', () => {
  it('domyślnie neutralna: szary tekst na szarym tle', async () => {
    await render(<Badge label="ZUS" />);

    const label = screen.getByText('ZUS');
    expect(label).toHaveStyle({ color: lightColors.textMuted });
    expect(label.parent).toHaveStyle({ backgroundColor: lightColors.neutralSoft });
  });

  it('ton danger: czerwony tekst na czerwonawym tle', async () => {
    await render(<Badge label="za 3 dni" tone="danger" />);

    const label = screen.getByText('za 3 dni');
    expect(label).toHaveStyle({ color: lightColors.danger });
    expect(label.parent).toHaveStyle({ backgroundColor: lightColors.dangerSoft });
  });
});
