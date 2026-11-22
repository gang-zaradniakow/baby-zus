import type { ArticleBlock } from '@/domain/knowledge/Article';

/** Przycisk pod odpowiedzią — prowadzi do miejsca w aplikacji (artykuł, kalkulator, kontakt…). */
export type AnswerAction = { label: string; href: string };

/** Jedno pytanie i odpowiedź w bazie wiedzy Asystenta. */
export type KnowledgeEntry = {
  id: string;
  /** Pytanie w zwykłej formie — pokazywane jako podpowiedź i „Podobne pytania”. */
  question: string;
  /** Słowa i frazy kluczowe (bez polskich znaków); „=fraza” — tylko dokładne dopasowanie słów. */
  keywords: string[];
  /** Odpowiedź w blokach (akapity, listy) — jak treść artykułów Wiedzy. */
  answer: ArticleBlock[];
  /** Źródło, np. „Poradnik, s. 23–25”. */
  source: string;
  actions: AnswerAction[];
  /** Temat trudny (strata dziecka) — delikatny ton, kontakt z człowiekiem. */
  crisis?: boolean;
};
