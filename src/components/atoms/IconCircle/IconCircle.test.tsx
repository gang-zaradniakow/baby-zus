import { render, screen } from '@testing-library/react-native';
import { Baby } from 'lucide-react-native';

import { lightColors } from '@/theme';

import { IconCircle } from './IconCircle';

describe('IconCircle', () => {
  it('domyślnie ton primary: zielona ikona na zielonkawym kole', async () => {
    await render(<IconCircle icon={Baby} />);

    const icon = screen.getByTestId('icon-Baby');
    expect(icon).toHaveProp('accessibilityHint', lightColors.primary);
    expect(icon.parent).toHaveStyle({ backgroundColor: lightColors.primarySoft });
  });

  it('ton info: niebieska ikona na niebieskawym kole', async () => {
    await render(<IconCircle icon={Baby} tone="info" />);

    const icon = screen.getByTestId('icon-Baby');
    expect(icon).toHaveProp('accessibilityHint', lightColors.info);
    expect(icon.parent).toHaveStyle({ backgroundColor: lightColors.infoSoft });
  });
});
