import { Text, type TextProps } from 'react-native';

import { typography, useTheme, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
};

/** Jedyny komponent tekstu w aplikacji: narzuca typografię i kolor z motywu. */
export function AppText({ variant = 'body', color, style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <Text
      style={[typography[variant], { color: color ?? colors.textPrimary }, style]}
      {...rest}
    />
  );
}
