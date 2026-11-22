/**
 * Kwota po polsku: „4 147,10 zł” (spacja między tysiącami, przecinek dziesiętny).
 * Bez `Intl`, bo silnik Hermes na Androidzie nie zawsze ma polskie dane lokalizacji.
 */
export function formatMoney(value: number, decimals: 0 | 2 = 2): string {
  const rounded = Math.round(value * 10 ** decimals) / 10 ** decimals;
  const negative = rounded < 0;
  const [whole, fraction] = Math.abs(rounded).toFixed(decimals).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${negative ? '−' : ''}${grouped}${fraction ? `,${fraction}` : ''} zł`;
}
