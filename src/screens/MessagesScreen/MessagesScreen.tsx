import { router } from 'expo-router';
import { Mail, MailOpen } from 'lucide-react-native';
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

type Folder = 'inbox' | 'archive';

/** Wiadomości: korespondencja z ZUS i archiwum — jak `vMessages` w prototypie (bez wniosków i szkiców). */
export function MessagesScreen() {
  const { colors } = useTheme();
  const { isSignedIn } = useSession();
  const zus = useZusData();
  const [folder, setFolder] = useState<Folder>('inbox');
  const back = () => router.dismissTo(moreRoutes.home);

  if (!isSignedIn || !zus) {
    return (
      <ScreenLayout title="Wiadomości" onBack={back} backLabel="Więcej">
        <LoginRequired reason="Korespondencję z ZUS pokażemy po zalogowaniu przez mObywatel." />
      </ScreenLayout>
    );
  }

  const documents = zus.documents.filter((d) => d.isArchived === (folder === 'archive'));
  const folders = [
    { value: 'inbox' as const, label: zus.unreadCount ? `Korespondencja (${zus.unreadCount})` : 'Korespondencja' },
    { value: 'archive' as const, label: 'Archiwum' },
  ];

  return (
    <ScreenLayout title="Wiadomości" subtitle="Pisma z ZUS z „tłumaczem pism”." onBack={back} backLabel="Więcej">
      <View style={styles.content}>
        <SegmentedControl options={folders} value={folder} onChange={setFolder} />
        {documents.length === 0 ? (
          <AppText color={colors.textMuted}>{folder === 'archive' ? 'Archiwum jest puste.' : 'Brak wiadomości.'}</AppText>
        ) : (
          documents.map((doc) => (
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
