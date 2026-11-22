import { hasExternalPayer } from './hasExternalPayer';

describe('hasExternalPayer', () => {
  it('umowa o pracę lub zlecenie — tak; sama firma albo brak — nie', () => {
    expect(hasExternalPayer(['uop'])).toBe(true);
    expect(hasExternalPayer(['zlec'])).toBe(true);
    expect(hasExternalPayer(['jdg', 'zlec'])).toBe(true);
    expect(hasExternalPayer(['jdg'])).toBe(false);
    expect(hasExternalPayer(['brak'])).toBe(false);
  });
});
