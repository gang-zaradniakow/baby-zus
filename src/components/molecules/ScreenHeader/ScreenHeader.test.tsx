import { render, screen } from '@testing-library/react-native';

import { ScreenHeader } from './ScreenHeader';

describe('ScreenHeader', () => {
  it('tytuł jest nagłówkiem dla czytnika ekranu', async () => {
    await render(<ScreenHeader title="Oś czasu" />);
    expect(screen.getByRole('header', { name: 'Oś czasu' })).toBeOnTheScreen();
  });

  it('pokazuje podtytuł, gdy jest podany', async () => {
    await render(<ScreenHeader title="Oś czasu" subtitle="Twoje urzędowe kroki." />);
    expect(screen.getByText('Twoje urzędowe kroki.')).toBeOnTheScreen();
  });

  it('bez podtytułu renderuje sam tytuł', async () => {
    await render(<ScreenHeader title="Oś czasu" />);
    expect(screen.queryByText('Twoje urzędowe kroki.')).not.toBeOnTheScreen();
  });
});
