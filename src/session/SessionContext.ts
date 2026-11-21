import { createContext } from 'react';

import type { ParentProfile } from '@/domain/profile/ParentProfile';

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
  signOut: () => void;
};

export const SessionContext = createContext<SessionValue>({
  isSignedIn: false,
  profile: null,
  completedTaskIds: new Set(),
  signIn: () => {},
  completeOnboarding: () => {},
  toggleTask: () => {},
  signOut: () => {},
});
