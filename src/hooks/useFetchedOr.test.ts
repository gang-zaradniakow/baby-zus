import { renderHook, waitFor } from '@testing-library/react-native';

import { useFetchedOr } from './useFetchedOr';

describe('useFetchedOr', () => {
  it('zwraca dane z backendu, gdy przyjdą', async () => {
    const fetcher = () => Promise.resolve(['z backendu']);
    const { result } = await renderHook(() => useFetchedOr(fetcher, ['lokalne']));
    await waitFor(() => expect(result.current).toEqual(['z backendu']));
  });

  it('przy błędzie zostaje przy danych lokalnych', async () => {
    const fetcher = jest.fn(() => Promise.reject(new Error('Brak sieci')));
    const { result } = await renderHook(() => useFetchedOr(fetcher, ['lokalne']));
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(result.current).toEqual(['lokalne']);
  });
});
