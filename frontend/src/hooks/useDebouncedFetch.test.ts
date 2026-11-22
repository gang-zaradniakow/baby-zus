import { act, renderHook } from '@testing-library/react-native';

import { useDebouncedFetch } from './useDebouncedFetch';

describe('useDebouncedFetch', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('pyta backend od razu, a po zmianach dopiero po przerwie, i zwraca odpowiedź dla bieżącego zapytania', async () => {
    const fetcher = jest.fn((request: { days: number }) => Promise.resolve(request.days * 10));
    const { result, rerender } = await renderHook(({ days }: { days: number }) => useDebouncedFetch({ days }, fetcher, 600), {
      initialProps: { days: 1 },
    });

    // Pierwsze zapytanie od razu — wynik po wejściu na ekran.
    await act(() => jest.advanceTimersByTimeAsync(0));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(10);

    await rerender({ days: 2 });
    await act(() => jest.advanceTimersByTimeAsync(300));
    await rerender({ days: 3 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(() => jest.advanceTimersByTimeAsync(600));
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenCalledWith({ days: 3 }, expect.any(AbortSignal));
    expect(result.current).toBe(30);

    // Nowa zmiana — stara odpowiedź już nie pasuje, do czasu nowej zwracamy null.
    await rerender({ days: 4 });
    expect(result.current).toBeNull();
  });

  it('przy błędzie i dla null zwraca null', async () => {
    const fetcher = jest.fn(() => Promise.reject(new Error('Brak sieci')));
    const { result, rerender } = await renderHook(({ request }: { request: { days: number } | null }) => useDebouncedFetch(request, fetcher, 600), {
      initialProps: { request: { days: 1 } as { days: number } | null },
    });
    await act(() => jest.advanceTimersByTimeAsync(600));
    expect(result.current).toBeNull();

    await rerender({ request: null });
    await act(() => jest.advanceTimersByTimeAsync(600));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
