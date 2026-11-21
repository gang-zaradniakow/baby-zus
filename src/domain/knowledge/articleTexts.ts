import type { Article, ArticleBlock } from './Article';

function blockTexts(block: ArticleBlock): string[] {
  switch (block.type) {
    case 'paragraph':
    case 'important':
    case 'example':
      return [block.text];
    case 'list':
      return block.items;
    case 'glossary':
      return block.entries.flatMap((entry) => [entry.term, entry.definition]);
    case 'table':
      return [...block.header, ...block.rows.flat()];
  }
}

/** Wszystkie teksty artykułu: tytuł, lead i treść bloków (ze znacznikami `**`). */
export function articleTexts(article: Article): string[] {
  return [article.title, article.lead, ...article.body.flatMap(blockTexts)];
}
