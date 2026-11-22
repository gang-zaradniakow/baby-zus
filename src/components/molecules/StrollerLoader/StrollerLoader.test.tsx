import { render, screen } from '@testing-library/react-native';

import { lightColors } from '@/theme';

import { StrollerLoader } from './StrollerLoader';

const hidden = { includeHiddenElements: true };

describe('StrollerLoader', () => {
  it('jest ozdobą ukrytą przed czytnikiem ekranu', async () => {
    await render(<StrollerLoader />);
    expect(screen.queryByTestId('stroller-loader')).toBeNull();
    expect(screen.getByTestId('stroller-loader', hidden)).toHaveProp('accessibilityElementsHidden', true);
  });

  it('kółko-tło w miękkim kolorze akcentu', async () => {
    await render(<StrollerLoader />);
    expect(screen.getByTestId('stroller-halo', hidden)).toHaveStyle({ backgroundColor: lightColors.accentSoft });
  });
});
