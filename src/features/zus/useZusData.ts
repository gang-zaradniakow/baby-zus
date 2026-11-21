import { findPersona } from '@/data/demo/personas';
import { buildZusAccount } from '@/domain/zus/buildZusAccount';
import { buildZusDocuments } from '@/domain/zus/buildZusDocuments';
import type { ZusAccount } from '@/domain/zus/ZusAccount';
import type { ZusDocument } from '@/domain/zus/ZusDocument';
import { useToday } from '@/hooks/useToday';
import { useLegalParams } from '@/params';
import { useSession } from '@/session';

/** Pismo ze stanem skrzynki (przeczytane / w archiwum). */
export type InboxDocument = ZusDocument & { isRead: boolean; isArchived: boolean };

export type ZusData = {
  account: ZusAccount;
  documents: InboxDocument[];
  unreadCount: number;
};

/**
 * Symulowane dane z eZUS dla bieżącego profilu: konto (tytuły, e-ZLA, zaległość) i pisma ze stanem
 * przeczytania i archiwum. Przykładowa osoba z Panelu demo dokłada swoje dane. `null` — brak profilu.
 */
export function useZusData(): ZusData | null {
  const today = useToday();
  const { profile, personaId, readDocumentIds, movedDocumentIds } = useSession();
  const { params } = useLegalParams();
  if (!profile) return null;

  const persona = findPersona(personaId);
  const account = buildZusAccount(profile, persona?.zus(today), params);
  const documents = buildZusDocuments(profile, account, today, persona?.documents(today), params).map((doc) => ({
    ...doc,
    isRead: !!doc.read || readDocumentIds.has(doc.id),
    // Przeniesienie zmienia stan początkowy: z archiwum do skrzynki i odwrotnie.
    isArchived: !!doc.archived !== movedDocumentIds.has(doc.id),
  }));

  return {
    account,
    documents,
    unreadCount: documents.filter((d) => !d.isRead && !d.isArchived).length,
  };
}
