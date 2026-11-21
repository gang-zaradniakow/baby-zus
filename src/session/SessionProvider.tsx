import { useMemo, useState, type ReactNode } from 'react';

import type { ParentProfile } from '@/domain/profile/ParentProfile';
import { toggleInSet } from '@/utils/toggleInSet';

import { SessionContext, type SessionValue } from './SessionContext';

type Props = { children: ReactNode };

const NO_TASKS: ReadonlySet<string> = new Set();

/**
 * Stan sesji w pamięci (prototyp: logowanie jest symulowane, odświeżenie = wylogowanie).
 * Trwały zapis (AsyncStorage / SecureStore) dodamy w osobnym kroku.
 */
export function SessionProvider({ children }: Props) {
  const [isSignedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<ReadonlySet<string>>(NO_TASKS);

  const value = useMemo<SessionValue>(
    () => ({
      isSignedIn,
      profile,
      completedTaskIds,
      signIn: () => setSignedIn(true),
      completeOnboarding: (newProfile) => {
        setProfile(newProfile);
        setCompletedTaskIds(NO_TASKS);
      },
      toggleTask: (taskId) => setCompletedTaskIds((ids) => toggleInSet(ids, taskId)),
      signOut: () => {
        setProfile(null);
        setCompletedTaskIds(NO_TASKS);
        setSignedIn(false);
      },
    }),
    [isSignedIn, profile, completedTaskIds],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
