import { renderHook } from '@testing-library/react-native';

import { useToday } from './useToday';

describe('useToday', () => {
  it('zwraca dzisiejszą datę ustawioną na 12:00', async () => {
    const { result } = await renderHook(() => useToday());
    const now = new Date();
    expect(result.current.getDate()).toBe(now.getDate());
    expect(result.current.getHours()).toBe(12);
  });

  it('zwraca ten sam obiekt przy kolejnych renderach', async () => {
    const { result, rerender } = await renderHook(() => useToday());
    const first = result.current;
    await rerender(undefined);
    expect(result.current).toBe(first);
  });
});
