import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/testing/renderWithProviders';

import { SliderField } from './SliderField';

describe('SliderField', () => {
  it('pokazuje etykietę i bieżącą wartość z jednostką', async () => {
    await renderWithProviders(
      <SliderField label="Rodzicielski taty" value={9} min={0} max={32} unit="tyg." onChange={jest.fn()} />,
    );

    expect(screen.getByText('Rodzicielski taty')).toBeOnTheScreen();
    expect(screen.getByText('9 tyg.')).toBeOnTheScreen();
  });
});
