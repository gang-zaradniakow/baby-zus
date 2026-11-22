import { render, screen } from '@testing-library/react-native';
import { Bell } from 'lucide-react-native';

import { lightColors } from '@/theme';

import { IconGlow } from './IconGlow';

describe('IconGlow', () => {
  it('rysuje ikonę w podanym kolorze', async () => {
    await render(<IconGlow icon={Bell} color={lightColors.primary} />);
    expect(screen.getByTestId('icon-Bell')).toHaveProp('accessibilityHint', lightColors.primary);
  });

  it('z glowColor: kółko w tym kolorze z rozmytą poświatą', async () => {
    await render(<IconGlow icon={Bell} color={lightColors.primary} glowColor={lightColors.primarySoft} />);
    expect(screen.getByTestId('icon-glow')).toHaveStyle({
      backgroundColor: lightColors.primarySoft,
      boxShadow: expect.stringContaining(lightColors.primarySoft),
    });
  });

  it('bez glowColor: bez tła i poświaty', async () => {
    await render(<IconGlow icon={Bell} color={lightColors.primary} />);
    expect(screen.getByTestId('icon-glow')).not.toHaveStyle({ backgroundColor: lightColors.primarySoft });
  });
});
