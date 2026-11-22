import { lightColors } from '@/theme';

import { resolveNavBarItemColors } from './resolveNavBarItemColors';

describe('resolveNavBarItemColors', () => {
  it('aktywna zakładka: kolor tonu i kółko z poświatą', () => {
    expect(resolveNavBarItemColors('primary', true, lightColors)).toEqual({
      icon: lightColors.primary,
      label: lightColors.primary,
      glow: lightColors.primarySoft,
    });
  });

  it('nieaktywna zakładka: szara, bez kółka', () => {
    expect(resolveNavBarItemColors('primary', false, lightColors)).toEqual({
      icon: lightColors.navInactive,
      label: lightColors.navInactive,
      glow: undefined,
    });
  });

  it('zakładka z akcentem (Asystent) zachowuje kolorową ikonę także gdy nieaktywna', () => {
    const colors = resolveNavBarItemColors('accent', false, lightColors);
    expect(colors.icon).toBe(lightColors.accent);
    expect(colors.label).toBe(lightColors.navInactive);
  });
});
