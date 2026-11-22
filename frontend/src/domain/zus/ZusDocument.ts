/** Pismo z ZUS w zakładce Wiadomości, z „tłumaczem pism” (co to znaczy i co trzeba zrobić). */
export type ZusDocument = {
  id: string;
  title: string;
  /** `RRRR-MM-DD`. */
  date: string;
  from: string;
  /** „Co to oznacza?” — pismo prostym językiem. */
  summary: string;
  /** „Co musisz zrobić”. */
  todo: string;
  /** Treść oryginalnego pisma. */
  body: string;
  /** Na start w archiwum (zamknięte sprawy). */
  archived?: boolean;
  /** Na start już przeczytane. */
  read?: boolean;
};
