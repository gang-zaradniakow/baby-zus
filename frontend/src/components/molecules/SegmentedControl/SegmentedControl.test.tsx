import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/testing/renderWithProviders';

import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 5, label: '5+' },
];

describe('SegmentedControl', () => {
  it('zaznacza wybraną opcję', async () => {
    await renderWithProviders(<SegmentedControl label="Liczba dzieci" options={OPTIONS} value={2} onChange={jest.fn()} />);

    expect(screen.getByRole('radio', { name: '2' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '5+' })).not.toBeChecked();
  });

  it('dotknięcie przekazuje wartość opcji', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    await renderWithProviders(<SegmentedControl options={OPTIONS} value={1} onChange={onChange} />);

    await user.press(screen.getByRole('radio', { name: '5+' }));

    expect(onChange).toHaveBeenCalledWith(5);
  });
});
