import { render, screen, userEvent } from '@testing-library/react-native';

import { makeTimelineItem } from '@/testing/timelineItems';

import { Timeline } from './Timeline';

const items = [
  makeTimelineItem({ id: 'usc', title: 'Zgłoś urodzenie dziecka' }),
  makeTimelineItem({ id: 'zus', title: 'Wniosek o zasiłek macierzyński', institution: 'ZUS' }),
];

describe('Timeline', () => {
  it('pusta lista: komunikat zamiast osi', async () => {
    await render(<Timeline items={[]} onToggleTask={jest.fn()} />);

    expect(screen.getByText('Brak zadań do pokazania.')).toBeOnTheScreen();
    expect(screen.queryByRole('checkbox')).not.toBeOnTheScreen();
  });

  it('renderuje wiersz dla każdej pozycji', async () => {
    await render(<Timeline items={items} onToggleTask={jest.fn()} />);

    expect(screen.queryByText('Brak zadań do pokazania.')).not.toBeOnTheScreen();
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    expect(screen.getByText('Wniosek o zasiłek macierzyński')).toBeOnTheScreen();
  });

  it('dotknięcie kropki przekazuje identyfikator właściwej pozycji', async () => {
    const onToggleTask = jest.fn();
    const user = userEvent.setup();
    await render(<Timeline items={items} onToggleTask={onToggleTask} />);

    await user.press(screen.getByRole('checkbox', { name: /Wniosek o zasiłek macierzyński/ }));

    expect(onToggleTask).toHaveBeenCalledWith('zus');
  });
});
