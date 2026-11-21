import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('godzina i minuty z zerami wiodącymi', () => {
    expect(formatTime(new Date(2026, 10, 23, 9, 5))).toBe('09:05');
    expect(formatTime(new Date(2026, 10, 23, 14, 30))).toBe('14:30');
  });
});
