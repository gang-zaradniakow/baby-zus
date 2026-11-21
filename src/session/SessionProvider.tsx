import { useMemo, useState, type ReactNode } from 'react';

import type { ParentProfile } from '@/domain/profile/ParentProfile';
import type { SentDocument } from '@/domain/wizards/SentDocument';
import { toggleInSet } from '@/utils/toggleInSet';

import { SessionContext, type SessionValue, type SupportMode } from './SessionContext';

type Props = { children: ReactNode };

const NO_IDS: ReadonlySet<string> = new Set();

/**
 * Stan sesji w pamięci (prototyp: logowanie jest symulowane, odświeżenie = wylogowanie).
 * Trwały zapis (AsyncStorage / SecureStore) dodamy w osobnym kroku.
 */
export function SessionProvider({ children }: Props) {
  const [isSignedIn, setSignedIn] = useState(false);
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<ReadonlySet<string>>(NO_IDS);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [readDocumentIds, setReadDocumentIds] = useState<ReadonlySet<string>>(NO_IDS);
  const [movedDocumentIds, setMovedDocumentIds] = useState<ReadonlySet<string>>(NO_IDS);
  const [supportMode, setSupportMode] = useState<SupportMode>('none');
  const [sentDocuments, setSentDocuments] = useState<readonly SentDocument[]>([]);

  /** Nowy profil = nowe terminy i pisma — czyścimy postęp i stan skrzynki. */
  const startFresh = (newProfile: ParentProfile | null, newPersonaId: string | null) => {
    setProfile(newProfile);
    setPersonaId(newPersonaId);
    setCompletedTaskIds(NO_IDS);
    setReadDocumentIds(NO_IDS);
    setMovedDocumentIds(NO_IDS);
    setSupportMode('none');
    setSentDocuments([]);
  };

  const value = useMemo<SessionValue>(
    () => ({
      isSignedIn,
      profile,
      completedTaskIds,
      signIn: () => setSignedIn(true),
      completeOnboarding: (newProfile) => startFresh(newProfile, null),
      toggleTask: (taskId) => setCompletedTaskIds((ids) => toggleInSet(ids, taskId)),
      signOut: () => setSignedIn(false),
      resetProfile: () => startFresh(null, null),
      personaId,
      applyPersona: (id, personaProfile) => {
        startFresh(personaProfile, id);
        setSignedIn(true);
      },
      readDocumentIds,
      markDocumentRead: (id) => setReadDocumentIds((ids) => (ids.has(id) ? ids : new Set([...ids, id]))),
      movedDocumentIds,
      toggleDocumentArchived: (id) => setMovedDocumentIds((ids) => toggleInSet(ids, id)),
      supportMode,
      setSupportMode,
      sentDocuments,
      addSentDocument: (document) => setSentDocuments((list) => [document, ...list]),
    }),
    [isSignedIn, profile, completedTaskIds, personaId, readDocumentIds, movedDocumentIds, supportMode, sentDocuments],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
