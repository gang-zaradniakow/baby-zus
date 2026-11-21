import { act, renderHook } from '@testing-library/react-native';

import { addDays, today, toISODate } from '@/domain/dates/calendarDate';
import { SessionProvider, useSession } from '@/session';
import { makeProfile } from '@/testing/profiles';

import { useTimeline } from './useTimeline';

function renderTimeline() {
  return renderHook(
    () => ({ timeline: useTimeline(), session: useSession() }),
    { wrapper: SessionProvider },
  );
}

const profile = makeProfile({ stage: 'dziecko', eventDate: toISODate(addDays(today(), -10)) });

describe('useTimeline', () => {
  it('bez profilu: pusta oś czasu i brak opisu', async () => {
    const { result } = await renderTimeline();

    expect(result.current.timeline.items).toEqual([]);
    expect(result.current.timeline.summary).toBe('');
  });

  it('z profilem: pozycje osi czasu i opis sytuacji', async () => {
    const { result } = await renderTimeline();

    await act(() => result.current.session.completeOnboarding(profile));

    expect(result.current.timeline.items.length).toBeGreaterThan(0);
    expect(result.current.timeline.summary).toMatch(/^Dziecko · /);
  });

  it('toggleTask oznacza pozycję jako zrobioną', async () => {
    const { result } = await renderTimeline();
    await act(() => result.current.session.completeOnboarding(profile));
    const task = result.current.timeline.items.find((item) => !item.milestone)!;

    await act(() => result.current.timeline.toggleTask(task.id));

    const updated = result.current.timeline.items.find((item) => item.id === task.id);
    expect(updated?.status).toBe('done');
  });
});
