import { render, screen } from '@testing-library/react-native';

import { makeTimelineItem } from '@/testing/timelineItems';

import { resolveTimelineVisuals } from '../resolveTimelineVisuals';

import { TimelineCard } from './TimelineCard';

function renderCard(overrides: Parameters<typeof makeTimelineItem>[0] = {}) {
  const item = makeTimelineItem(overrides);
  return render(<TimelineCard item={item} visuals={resolveTimelineVisuals(item)} />);
}

describe('TimelineCard', () => {
  it('pokazuje instytucję, tytuł i datę', async () => {
    await renderCard();

    expect(screen.getByText('USC / mObywatel')).toBeOnTheScreen();
    expect(screen.getByText('Zgłoś urodzenie dziecka')).toBeOnTheScreen();
    expect(screen.getByText('01.12.2026')).toBeOnTheScreen();
  });

  it('pokazuje opis, gdy jest podany', async () => {
    await renderCard({ description: 'Akt urodzenia wystawi USC.' });
    expect(screen.getByText('Akt urodzenia wystawi USC.')).toBeOnTheScreen();
  });

  it('pilne zadanie ma odznakę statusu', async () => {
    const item = makeTimelineItem({ status: 'now', daysLeft: 3 });
    const visuals = resolveTimelineVisuals(item);
    await render(<TimelineCard item={item} visuals={visuals} />);

    expect(visuals.statusLabel).toBeTruthy();
    expect(screen.getByText(visuals.statusLabel!)).toBeOnTheScreen();
  });

  it('zadanie przyszłe ma tylko odznakę instytucji', async () => {
    const urgent = makeTimelineItem({ status: 'now', daysLeft: 3 });
    const urgentLabel = resolveTimelineVisuals(urgent).statusLabel!;
    await renderCard({ status: 'future' });

    expect(screen.getByText('USC / mObywatel')).toBeOnTheScreen();
    expect(screen.queryByText(urgentLabel)).not.toBeOnTheScreen();
  });
});
