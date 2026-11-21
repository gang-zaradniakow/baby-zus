import type { ArticleBlock } from '@/domain/knowledge/Article';

import { CalloutBlock } from './CalloutBlock';
import { GlossaryBlock } from './GlossaryBlock';
import { ListBlock } from './ListBlock';
import { ParagraphBlock } from './ParagraphBlock';
import { TableBlock } from './TableBlock';

type Props = { block: ArticleBlock };

/** Wybiera komponent dla jednego bloku treści artykułu. */
export function ArticleBlockView({ block }: Props) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock text={block.text} />;
    case 'list':
      return <ListBlock items={block.items} ordered={block.ordered} />;
    case 'glossary':
      return <GlossaryBlock entries={block.entries} />;
    case 'important':
    case 'example':
      return <CalloutBlock kind={block.type} text={block.text} />;
    case 'table':
      return <TableBlock header={block.header} rows={block.rows} />;
  }
}
