import { RichText } from '@/components/atoms/RichText';

type Props = { text: string };

/** Akapit treści artykułu. */
export function ParagraphBlock({ text }: Props) {
  return <RichText text={text} />;
}
