import { AppText } from '@/components/atoms/AppText';
import type { TypographyVariant } from '@/theme';
import { splitBoldSegments } from '@/utils/splitBoldSegments';

type Props = {
  /** Tekst z pogrubieniami zapisanymi jako `**tak**`. */
  text: string;
  variant?: TypographyVariant;
  color?: string;
};

/** Tekst z pogrubieniami w środku zdania (treść artykułów, odpowiedzi asystenta). */
export function RichText({ text, variant = 'body', color }: Props) {
  return (
    <AppText variant={variant} color={color}>
      {splitBoldSegments(text).map((segment, i) =>
        segment.bold ? (
          // Zagnieżdżony tekst dziedziczy rozmiar po rodzicu; wariant `strong` zmienia tylko grubość.
          <AppText key={i} variant="strong" color={color}>
            {segment.text}
          </AppText>
        ) : (
          segment.text
        ),
      )}
    </AppText>
  );
}
