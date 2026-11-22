import { render, screen, userEvent } from '@testing-library/react-native';

import { makeTimelineItem } from '@/testing/timelineItems';

import { resolveTimelineVisuals } from '../resolveTimelineVisuals';

import { TimelineDot } from './TimelineDot';

const TITLE = 'Zgłoś urodzenie dziecka';

describe('TimelineDot', () => {
  it('niezrobione: checkbox z akcją „Oznacz jako zrobione”', async () => {
    const visuals = resolveTimelineVisuals(makeTimelineItem({ status: 'now', daysLeft: 5 }));
    await render(<TimelineDot visuals={visuals} title={TITLE} done={false} onToggle={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: `Oznacz jako zrobione: ${TITLE}` })).not.toBeChecked();
  });

  it('zrobione: zaznaczony checkbox z akcją cofnięcia', async () => {
    const visuals = resolveTimelineVisuals(makeTimelineItem({ status: 'done' }));
    await render(<TimelineDot visuals={visuals} title={TITLE} done onToggle={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: `Oznacz jako niezrobione: ${TITLE}` })).toBeChecked();
  });

  it('dotknięcie kropki przełącza zadanie', async () => {
    const onToggle = jest.fn();
    const user = userEvent.setup();
    const visuals = resolveTimelineVisuals(makeTimelineItem());
    await render(<TimelineDot visuals={visuals} title={TITLE} done={false} onToggle={onToggle} />);

    await user.press(screen.getByRole('checkbox'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
