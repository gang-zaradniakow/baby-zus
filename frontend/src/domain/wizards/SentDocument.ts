import type { WizardResult } from './Wizard';

/** Wynik kreatora zapisany w „Moje dokumenty” (pismo do kadr albo wniosek z UPO — symulacja). */
export type SentDocument = WizardResult & {
  id: string;
  wizardId: string;
  createdAt: Date;
  applicantName: string;
  /** Szkic z kreatora `draft` — nic nie zostało wysłane, złożyć trzeba po porodzie. */
  draft?: boolean;
  /** Numer Urzędowego Poświadczenia Odbioru — tylko przy wniosku do ZUS/USC (symulacja). */
  upo?: string;
};
