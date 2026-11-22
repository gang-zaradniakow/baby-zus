import { render, screen } from '@testing-library/react-native';

import { EventDateStep } from './EventDateStep';

describe('EventDateStep', () => {
  it.each([
    ['ciaza', 'Kiedy masz termin porodu?', 'Przewidywany termin porodu'],
    ['dziecko', 'Kiedy urodziło się dziecko?', 'Data urodzenia'],
    ['adopcja', 'Kiedy przyjęliście dziecko?', 'Data przyjęcia dziecka'],
  ] as const)('etap %s: pytanie i etykieta pola dopasowane do sytuacji', async (stage, title, label) => {
    await render(<EventDateStep stage={stage} value="" error={null} onChange={jest.fn()} />);

    expect(screen.getByRole('header', { name: title })).toBeOnTheScreen();
    expect(screen.getByLabelText(label)).toBeOnTheScreen();
  });

  it('pokazuje przekazany błąd walidacji', async () => {
    await render(<EventDateStep stage="dziecko" value="31.02.2026" error="Taka data nie istnieje." onChange={jest.fn()} />);

    expect(screen.getByLabelText('Data urodzenia')).toHaveDisplayValue('31.02.2026');
    expect(screen.getByText('Taka data nie istnieje.')).toBeOnTheScreen();
  });
});
