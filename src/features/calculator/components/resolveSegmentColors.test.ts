import { lightColors } from '@/theme';

import { resolveSegmentColors } from './resolveSegmentColors';

describe('resolveSegmentColors', () => {
  it('stopa decyduje o kolorze, praca na urlopie ma własny', () => {
    expect(resolveSegmentColors({ rate: 1, factor: 1 }, lightColors).background).toBe(lightColors.primary);
    expect(resolveSegmentColors({ rate: 0.815, factor: 1 }, lightColors).background).toBe(lightColors.info);
    expect(resolveSegmentColors({ rate: 0.7, factor: 1 }, lightColors).background).toBe(lightColors.primarySoft);
    expect(resolveSegmentColors({ rate: 0.7, factor: 0.5 }, lightColors).background).toBe(lightColors.accentSoft);
  });
});
