/**
 * Treść zakładki „Wiedza” — streszczenie „Poradnika dla rodziców i opiekunów dzieci” (ZUS, stan prawny
 * 1.04.2026). Tekst w blokach może zawierać pogrubienia zapisane jako `**tak**`.
 */
export type ChapterId = 'start' | 'ubezp' | 'ciaza' | 'po' | 'trudne' | 'opieka' | 'ryzyka';

/** Klucz linku do zus.pl / gov.pl — patrz `ZUS_LINKS` w `data/knowledge`. */
export type ZusLinkId =
  | 'rodzice'
  | 'macUrodzenie'
  | 'macRodz'
  | 'macOjc'
  | 'macWys'
  | 'macOkres'
  | 'macPoUstaniu'
  | 'wczesniaki'
  | 'tata'
  | 'martwe'
  | 'pogrzebowy'
  | 'ewizyta'
  | 'formularze'
  | 'mrpips'
  | 'pip'
  | 'usc';

export type GlossaryEntry = { term: string; definition: string };

/** Jeden kawałek treści artykułu — każdy typ ma własny wygląd. */
export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'glossary'; entries: GlossaryEntry[] }
  /** Ramka „WAŻNE!”. */
  | { type: 'important'; text: string }
  /** Ramka „Przykład”. */
  | { type: 'example'; text: string }
  | { type: 'table'; header: string[]; rows: string[][] };

/** Do którego wariantu kalkulatora prowadzi przycisk „Policz” (Faza 4). */
export type CalculatorVariant = 'ciaza' | 'birth' | 'adopt';

export type Article = {
  id: string;
  chapterId: ChapterId;
  title: string;
  /** Jedno zdanie pod tytułem — widoczne też na liście artykułów. */
  lead: string;
  /** Źródło, np. „Poradnik, s. 12”. */
  source: string;
  body: ArticleBlock[];
  links: ZusLinkId[];
  calculator?: CalculatorVariant;
  /** Identyfikator kreatora wniosku z prototypu (Faza 7). */
  wizard?: string;
  /** Trudny temat (strata dziecka) — spokojniejszy wygląd, bez wesołych akcentów. */
  sensitive?: boolean;
};
