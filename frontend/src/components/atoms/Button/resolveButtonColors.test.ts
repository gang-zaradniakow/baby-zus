import { lightColors } from '@/theme';

import { resolveButtonColors } from './resolveButtonColors';

describe('resolveButtonColors', () => {
  it('primary: zielone tło, biały tekst', () => {
    expect(resolveButtonColors('primary', lightColors)).toEqual({
      background: lightColors.primary,
      border: lightColors.primary,
      text: lightColors.onPrimary,
    });
  });

  it('mobywatel: niebieskie tło usługi rządowej', () => {
    expect(resolveButtonColors('mobywatel', lightColors).background).toBe(lightColors.mobywatel);
  });

  it('secondary: tło karty z obramowaniem', () => {
    expect(resolveButtonColors('secondary', lightColors)).toEqual({
      background: lightColors.surface,
      border: lightColors.borderStrong,
      text: lightColors.textPrimary,
    });
  });
});
