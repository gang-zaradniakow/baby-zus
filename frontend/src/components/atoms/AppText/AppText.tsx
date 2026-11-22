import { Text, type TextProps } from 'react-native';

import { scaleTextStyle, typography, useTheme, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

/** Jedyny komponent tekstu w aplikacji: narzuca typografię (w rozmiarze z Ustawień) i kolor z motywu. */
export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  const { colors, textScale } = useTheme();

  return (
    <Text
      style={[scaleTextStyle(typography[variant], textScale), { color: color ?? colors.textPrimary }, style]}
      {...rest}
    />
  );
}
