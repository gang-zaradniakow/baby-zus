import type { ChapterId } from '@/domain/knowledge/Article';

/** Adresy ekranów Wiedzy — w jednym miejscu, żeby ekrany nie sklejały ścieżek same. */
export const knowledgeRoutes = {
  home: '/wiedza',
  chapter: (chapterId: ChapterId) => `/wiedza/${chapterId}`,
  article: (articleId: string) => `/wiedza/artykul/${articleId}`,
} as const;
