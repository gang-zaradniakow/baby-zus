/** Symulowane konto eZUS (prototyp — dane fikcyjne, w produkcji przychodzą z eZUS po zalogowaniu). */

/** Ubezpieczenie chorobowe z danego tytułu. */
export type SicknessInsurance = 'mandatory' | 'voluntary' | 'none' | 'krus';

export type ZusTitle = {
  name: string;
  payer: string;
  /** Od kiedy (`RRRR-MM-DD`). */
  since: string;
  sickness: SicknessInsurance;
  /** Podstawa składek (zł / mies.); 0 — brak. */
  contributionBase: number;
};

/** Zaświadczenie lekarskie e-ZLA. */
export type SickLeaveCertificate = {
  number: string;
  from: Date;
  to: Date;
  /** Kod literowy: B — ciąża, C — opieka nad chorym dzieckiem. */
  code: string;
  indication: string;
  status: string;
};

export type ZusAccount = {
  titles: ZusTitle[];
  certificates: SickLeaveCertificate[];
  /** Zaległość w składkach (zł). */
  debt: number;
  /** Czy którykolwiek tytuł daje ubezpieczenie chorobowe w ZUS. */
  hasSicknessInsurance: boolean;
};

/** Dodatkowe dane konta, których nie ma w ankiecie (podstawa, zaległość, e-ZLA) — z przykładowej osoby. */
export type ZusAccountExtras = {
  contributionBase: number;
  debt: number;
  certificates: SickLeaveCertificate[];
};
