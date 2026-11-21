import { router } from 'expo-router';
import { CircleCheck, FileText, Mail, MailOpen } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { LinkRow } from '@/components/molecules/LinkRow';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { fromISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { LoginRequired } from '@/features/more/components/LoginRequired';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useZusData } from '@/features/zus/useZusData';
import { useSession } from '@/session';
import { useTheme } from '@/theme';

import { styles } from './MessagesScreen.styles';

type Folder = 'inbox' | 'mine' | 'archive';

/**
 * Wiadomości (port vMessages): korespondencja z ZUS i archiwum (po zalogowaniu) oraz „Moje dokumenty” —
 * pisma i wnioski z kreatorów (także dla gościa, bo pismo do pracodawcy nie wymaga logowania).
 */
export function MessagesScreen() {
  const { colors } = useTheme();
  const { isSignedIn, sentDocuments } = useSession();
  const zus = useZusData();
  const signedIn = isSignedIn && !!zus;
  const [folder, setFolder] = useState<Folder>(signedIn ? 'inbox' : 'mine');
  const back = () => router.dismissTo(moreRoutes.home);

  const unread = zus?.unreadCount ?? 0;
  const folders = [
    { value: 'inbox' as const, label: unread && signedIn ? `Z ZUS (${unread})` : 'Z ZUS' },
    { value: 'mine' as const, label: 'Moje dokumenty' },
    { value: 'archive' as const, label: 'Archiwum' },
  ];
  const correspondence = zus?.documents.filter((d) => d.isArchived === (folder === 'archive')) ?? [];

  return (
    <ScreenLayout title="Wiadomości" subtitle="Pisma z ZUS z „tłumaczem pism” i Twoje dokumenty." onBack={back} backLabel="Więcej">
      <View style={styles.content}>
        <SegmentedControl options={folders} value={folder} onChange={setFolder} />
        {folder === 'mine' ? (
          sentDocuments.length === 0 ? (
            <AppText color={colors.textMuted}>Tu pojawią się Twoje pisma i wnioski (UPO) z kreatorów.</AppText>
          ) : (
            sentDocuments.map((doc) => (
              <LinkRow
                key={doc.id}
                icon={doc.kind === 'letter' ? FileText : CircleCheck}
                tone="primary"
                title={doc.title}
                subtitle={`${formatDate(doc.createdAt)} · ${doc.kind === 'letter' ? 'pismo do pracodawcy' : `UPO z ${doc.destination}`}`}
                onPress={() => router.push(moreRoutes.result(doc.id))}
              />
            ))
          )
        ) : !signedIn ? (
          <LoginRequired reason="Korespondencję z ZUS pokażemy po zalogowaniu przez mObywatel." />
        ) : correspondence.length === 0 ? (
          <AppText color={colors.textMuted}>{folder === 'archive' ? 'Archiwum jest puste.' : 'Brak wiadomości.'}</AppText>
        ) : (
          correspondence.map((doc) => (
            <LinkRow
              key={doc.id}
              icon={doc.isRead ? MailOpen : Mail}
              tone={doc.isRead ? 'neutral' : 'accent'}
              title={doc.title}
              subtitle={`${formatDate(fromISODate(doc.date))}${doc.isRead ? '' : ' · nowe'}`}
              onPress={() => router.push(moreRoutes.document(doc.id))}
            />
          ))
        )}
      </View>
    </ScreenLayout>
  );
}
