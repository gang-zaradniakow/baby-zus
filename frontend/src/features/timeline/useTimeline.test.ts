import { act, renderHook, waitFor } from '@testing-library/react-native';

import { resetApiConfigForTests } from '@/api/apiConfig';

import { addDays, fromISODate, today, toISODate } from '@/domain/dates/calendarDate';
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

  it('terminy potwierdza serwer — jego dzień obowiązujący zastępuje lokalny', async () => {
    const realFetch = globalThis.fetch;
    resetApiConfigForTests();
    process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
    // „Serwer” przesuwa każdy termin o 2 dni — żeby było widać, że wynik pochodzi z niego.
    globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const query = new URL(String(input)).searchParams;
      const event = fromISODate(query.get('event')!);
      const days = Number(query.get('days') ?? 0) + Number(query.get('months') ?? 0) * 30;
      const sign = query.get('type') === 'BEFORE' ? -1 : 1;
      const legal = toISODate(addDays(event, sign * days + 2));
      return { ok: true, json: async () => ({ type: query.get('type'), raw: legal, legal, safe: legal, shifted: false }) } as Response;
    }) as typeof fetch;

    try {
      const { result } = await renderTimeline();
      await act(() => result.current.session.completeOnboarding(profile));
      const zasilek = () => result.current.timeline.items.find((item) => item.deadline?.rule?.days === 21)!;
      const localDue = toISODate(addDays(fromISODate(profile.eventDate), 21));

      await waitFor(() => expect(toISODate(zasilek().due)).not.toBe(localDue));
      expect(toISODate(zasilek().due)).toBe(toISODate(addDays(fromISODate(profile.eventDate), 23)));
    } finally {
      globalThis.fetch = realFetch;
      process.env.EXPO_PUBLIC_API_URL = '';
      resetApiConfigForTests();
    }
  });
});
