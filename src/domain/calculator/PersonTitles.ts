/**
 * Tytuły ubezpieczenia jednej osoby w kalkulatorze. Identyfikatory jak w profilu (`EmploymentId`):
 * `uop` etat, `zlec` zlecenie, `jdg` firma; dochodzi `krus` (rolnik).
 * `base` — podstawa wymiaru zasiłku z danego tytułu, już po odjęciu 13,71% składek.
 */
export type PersonTitles = {
  uop?: {
    on: boolean;
    base: number;
    /** Etat z co najmniej płacą minimalną — wtedy zlecenie i firma nie dają chorobowego. */
    atLeastMinWage: boolean;
  };
  zlec?: {
    on: boolean;
    base: number;
    voluntarySickness: boolean;
    /** Student / uczeń do 26 lat — zlecenie nie podlega ubezpieczeniom. */
    student: boolean;
  };
  jdg?: {
    on: boolean;
    base: number;
    voluntarySickness: boolean;
    /** Ulga na start — pierwsze 6 miesięcy bez ubezpieczeń społecznych. */
    startRelief: boolean;
    /** Zaległość w składkach (zł). */
    debt: number;
  };
  krus?: { on: boolean };
};

export type InsuranceTitleId = 'uop' | 'zlec' | 'jdg';

export const TITLE_LABELS: Record<InsuranceTitleId | 'krus', string> = {
  uop: 'etat',
  zlec: 'zlecenie',
  jdg: 'firma',
  krus: 'KRUS',
};
