import { scaleTextStyle } from './scaleTextStyle';
import { typography } from './typography';

describe('scaleTextStyle', () => {
  it('skala 1 — bez zmian', () => {
    expect(scaleTextStyle(typography.body, 1)).toBe(typography.body);
  });

  it('powiększa rozmiar i interlinię, zostawia grubość', () => {
    expect(scaleTextStyle(typography.body, 1.3)).toEqual({ fontSize: 18, fontWeight: '500', lineHeight: 26 });
  });

  it('wariant bez rozmiaru (pogrubienie w tekście) — dziedziczy po rodzicu, nic do skalowania', () => {
    expect(scaleTextStyle(typography.strong, 1.3)).toEqual(typography.strong);
  });
});
