/** Identyfikatory zgodne z prototypem mZUS (data.js), żeby przenosić logikę świadczeń 1:1. */
/** `planuje` — dziecka jeszcze nie ma w drodze; osoba sprawdza, ile dostanie w ciąży i po porodzie. */
export type ParentStage = 'planuje' | 'ciaza' | 'dziecko' | 'adopcja';

/** Kim osoba wypełniająca ankietę jest dla dziecka. */
export type ParentRole = 'mama' | 'tata' | 'opiekun';

export type EmploymentId = 'uop' | 'jdg' | 'zlec' | 'brak';

/**
 * Wielkość płatnika składek: do 20 osób zasiłek wypłaca ZUS, od 21 — pracodawca.
 * `niewiem` — pokazujemy oba warianty.
 */
export type PayerSize = 'duzy' | 'maly' | 'niewiem';

/**
 * Drugi rodzic: pokazujemy też jego uprawnienia (`track`), tylko moje (`notrack`)
 * albo wychowuję dziecko samodzielnie (`single`).
 */
export type PartnerMode = 'track' | 'notrack' | 'single';

/** Jedno dziecko, bliźnięta albo trojaczki i więcej — od tego zależy długość urlopów. */
export type ChildrenCount = 1 | 2 | 3;

export type SpecialSituationId = 'abroad' | 'disability' | 'preterm' | 'zazyciem';

/** Wynik ankiety — sytuacja rodzica, od której zależą terminy i świadczenia. */
export type ParentProfile = {
  role: ParentRole;
  stage: ParentStage;
  /**
   * Data zdarzenia w formacie `RRRR-MM-DD`, zależnie od etapu:
   * planowany termin porodu (planuje), termin porodu (ciąża), data urodzenia (dziecko) albo data przyjęcia (adopcja).
   */
  eventDate: string;
  /** Przy adopcji: data urodzenia dziecka (`RRRR-MM-DD`) — od niej zależy długość urlopu. */
  childBirthDate?: string;
  childrenCount: ChildrenCount;
  employment: EmploymentId[];
  /** Tylko przy umowie o pracę lub zleceniu. */
  payerSize?: PayerSize;
  partner: PartnerMode;
  special: SpecialSituationId[];
  /** Imię rodzica — opcjonalne, do personalizacji tekstów. */
  name?: string;
  /** Imię dziecka — opcjonalne, nie pytamy w ciąży. */
  childName?: string;
};
