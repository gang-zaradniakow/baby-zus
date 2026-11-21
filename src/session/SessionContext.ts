import { createContext } from 'react';

import type { ParentProfile } from '@/domain/profile/ParentProfile';

/** Tryb wsparcia po stracie: Start bez odliczania i gratulacji, tylko to, co pomaga. */
export type SupportMode = 'none' | 'pregnancyLoss' | 'childDeath';

/** Dane zalogowanego rodzica: czy jest zalogowany, jego profil i postęp na osi czasu. */
export type SessionValue = {
  isSignedIn: boolean;
  /** `null` = użytkownik jeszcze nie przeszedł onboardingu. */
  profile: ParentProfile | null;
  /** Identyfikatory pozycji osi czasu oznaczonych jako zrobione. */
  completedTaskIds: ReadonlySet<string>;
  signIn: () => void;
  completeOnboarding: (profile: ParentProfile) => void;
  toggleTask: (taskId: string) => void;
  /** Wylogowuje — profil gościa (ankieta) zostaje, bo nie zależy od logowania. */
  signOut: () => void;
  /** Czyści profil i postęp (np. „Usuń moje odpowiedzi i zacznij od nowa” dla gościa). */
  resetProfile: () => void;
  /** Przykładowa osoba z Panelu demo (`null` — własny profil). */
  personaId: string | null;
  /** Panel demo: podmienia profil na przykładową osobę i loguje (symulacja eZUS). */
  applyPersona: (personaId: string, profile: ParentProfile) => void;
  /** Pisma z ZUS otwarte przez użytkownika. */
  readDocumentIds: ReadonlySet<string>;
  markDocumentRead: (documentId: string) => void;
  /** Pisma, którym użytkownik zmienił stan archiwum (przeniósł do archiwum albo z niego przywrócił). */
  movedDocumentIds: ReadonlySet<string>;
  toggleDocumentArchived: (documentId: string) => void;
  supportMode: SupportMode;
  /** Włącza / wyłącza tryb wsparcia — zawsze po potwierdzeniu przez użytkownika. */
  setSupportMode: (mode: SupportMode) => void;
};

export const SessionContext = createContext<SessionValue>({
  isSignedIn: false,
  profile: null,
  completedTaskIds: new Set(),
  signIn: () => {},
  completeOnboarding: () => {},
  toggleTask: () => {},
  signOut: () => {},
  resetProfile: () => {},
  personaId: null,
  applyPersona: () => {},
  readDocumentIds: new Set(),
  markDocumentRead: () => {},
  movedDocumentIds: new Set(),
  toggleDocumentArchived: () => {},
  supportMode: 'none',
  setSupportMode: () => {},
});
