/** Identyfikatory zgodne z prototypem mZUS (data.js), żeby przenosić logikę świadczeń 1:1. */
export type ParentStage = 'ciaza' | 'dziecko' | 'adopcja';

export type EmploymentId = 'uop' | 'jdg' | 'zlec' | 'brak';

export type SpecialSituationId = 'abroad' | 'disability' | 'single';

/** Wynik onboardingu — sytuacja rodzica, od której zależą terminy i świadczenia. */
export type ParentProfile = {
  stage: ParentStage;
  /**
   * Data zdarzenia w formacie `RRRR-MM-DD`, zależnie od etapu:
   * termin porodu (ciąża), data urodzenia (dziecko) albo data przyjęcia (adopcja).
   */
  eventDate: string;
  employment: EmploymentId[];
  special: SpecialSituationId[];
};
