import type { LegalParams } from '@/data/legalParams';

/**
 * Kreator wniosku „jednego oddechu” (port `WIZARDS` z prototypu, js/wizards.js): jedno pytanie na
 * ekran, łagodne komunikaty, na końcu podsumowanie i gotowe pismo albo wniosek do ZUS (mock).
 */

/** Odpowiedzi kreatora: daty jako tekst `DD.MM.RRRR` (jak w polu daty), liczby i wybory jako tekst. */
export type WizardAnswers = Readonly<Record<string, string>>;

/** Dokąd trafia wynik: pismo do pracodawcy, wniosek do ZUS (eZUS) albo do USC (gov.pl). */
export type WizardInstitution = 'PRAC' | 'ZUS' | 'USC';

/** Dane z profilu potrzebne kreatorom (bez Reacta). */
export type WizardContext = {
  today: Date;
  /** Imię i nazwisko do pisma (w prototypie zaślepka: imię z ankiety + „Przykładowa/y”). */
  applicantName: string;
  childName: string;
  /** Data urodzenia dziecka (przy adopcji — jeśli znana). */
  childBirth: Date | null;
  /** Data przyjęcia dziecka (adopcja / rodzina zastępcza). */
  adoptionDate: Date | null;
  /** Przewidywany termin porodu — tylko w ciąży. */
  dueDate: Date | null;
  childrenCount: number;
  /** Sama firma (bez etatu) — wnioski idą prosto do ZUS. */
  businessOnly: boolean;
  params: LegalParams;
};

/** `error` blokuje „Dalej”, `warning` tylko ostrzega (np. „minęło ponad 7 dni — złóż jak najszybciej”). */
export type StepIssue = { level: 'error' | 'warning'; text: string };

export type ChoiceOption = { value: string; label: string; hint?: string };

type StepBase = {
  id: string;
  question: string;
  hint?: string;
  /** Wartość startowa z profilu (np. data urodzenia). */
  prefill?: (ctx: WizardContext) => string;
  validate?: (answers: WizardAnswers, ctx: WizardContext) => StepIssue | null;
};

export type WizardStep =
  | (StepBase & { kind: 'date' })
  | (StepBase & { kind: 'number'; min: number; max: number; unit?: string })
  | (StepBase & { kind: 'choice'; options: readonly ChoiceOption[] })
  /** Informacja do potwierdzenia (np. czyj to akt) — bez odpowiedzi. */
  | (StepBase & { kind: 'info'; text: (ctx: WizardContext) => string })
  /** Dokument do dołączenia — w prototypie wybór pliku; tu deklaracja „dołączę” (mock). */
  | (StepBase & { kind: 'document' });

/** Pismo do pracodawcy (do wydruku / udostępnienia). */
export type Letter = {
  to: string;
  /** Tytuł pisma w kilku liniach (np. „WNIOSEK”, „o udzielenie urlopu ojcowskiego”). */
  heading: string[];
  paragraphs: string[];
  attachments: string[];
};

export type WizardResult =
  | { kind: 'letter'; title: string; letter: Letter; note?: string }
  | { kind: 'submission'; title: string; form: string; summary: string; destination: string };

export type WizardDefinition = {
  id: string;
  title: string;
  short: string;
  intro: string;
  institution: (ctx: WizardContext) => WizardInstitution;
  /**
   * Szkic przygotowywany przed zdarzeniem (np. w ciąży): wynik zapisujemy w „Moich dokumentach”
   * bez wysyłki i bez logowania — złożyć go trzeba dopiero po porodzie.
   */
  draft?: boolean;
  steps: (ctx: WizardContext) => WizardStep[];
  build: (answers: WizardAnswers, ctx: WizardContext) => WizardResult;
};
