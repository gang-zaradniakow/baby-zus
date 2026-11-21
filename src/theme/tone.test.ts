import { darkColors, lightColors } from './colors';
import { resolveTone, type Tone } from './tone';

describe('resolveTone', () => {
  it.each<[Tone, string, string]>([
    ['primary', lightColors.primary, lightColors.primarySoft],
    ['accent', lightColors.accent, lightColors.accentSoft],
    ['info', lightColors.info, lightColors.infoSoft],
    ['danger', lightColors.danger, lightColors.dangerSoft],
    ['neutral', lightColors.textMuted, lightColors.neutralSoft],
  ])('%s → kolor główny i tło z motywu', (tone, main, soft) => {
    expect(resolveTone(tone, lightColors)).toEqual({ main, soft });
  });

  it('korzysta z przekazanego motywu (ciemny)', () => {
    expect(resolveTone('danger', darkColors).main).toBe(darkColors.danger);
  });
});
