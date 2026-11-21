import { render, screen } from '@testing-library/react-native';
import { Bell } from 'lucide-react-native';

import { lightColors } from '@/theme';

import { IconPill } from './IconPill';

describe('IconPill', () => {
  it('rysuje ikonę w podanym kolorze', async () => {
    await render(<IconPill icon={Bell} color={lightColors.primary} />);
    expect(screen.getByTestId('icon-Bell')).toHaveProp('accessibilityHint', lightColors.primary);
  });

  it('z backgroundColor: tło „pigułki” w tym kolorze', async () => {
    await render(<IconPill icon={Bell} color={lightColors.primary} backgroundColor={lightColors.primarySoft} />);
    expect(screen.getByTestId('icon-Bell').parent).toHaveStyle({ backgroundColor: lightColors.primarySoft });
  });

  it('bez backgroundColor: przezroczyste tło', async () => {
    await render(<IconPill icon={Bell} color={lightColors.primary} />);
    expect(screen.getByTestId('icon-Bell').parent).not.toHaveStyle({ backgroundColor: lightColors.primarySoft });
  });
});
