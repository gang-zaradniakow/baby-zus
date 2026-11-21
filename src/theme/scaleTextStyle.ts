import type { TextStyle } from 'react-native';

/** Powiększa wariant typografii (rozmiar, interlinię, odstępy liter) o skalę z Ustawień. */
export function scaleTextStyle(style: TextStyle, scale: number): TextStyle {
  if (scale === 1) return style;
  return {
    ...style,
    ...(style.fontSize !== undefined && { fontSize: Math.round(style.fontSize * scale) }),
    ...(style.lineHeight !== undefined && { lineHeight: Math.round(style.lineHeight * scale) }),
    ...(style.letterSpacing !== undefined && { letterSpacing: style.letterSpacing * scale }),
  };
}
