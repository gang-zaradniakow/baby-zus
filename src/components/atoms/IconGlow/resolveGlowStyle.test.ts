import { resolveGlowStyle } from './resolveGlowStyle';

describe('resolveGlowStyle', () => {
  it('wypełnia kółko kolorem i rozmywa poświatę w tym samym kolorze', () => {
    expect(resolveGlowStyle('rgba(17, 115, 75, 0.10)')).toEqual({
      backgroundColor: 'rgba(17, 115, 75, 0.10)',
      boxShadow: '0px 0px 16px 4px rgba(17, 115, 75, 0.10)',
    });
  });
});
