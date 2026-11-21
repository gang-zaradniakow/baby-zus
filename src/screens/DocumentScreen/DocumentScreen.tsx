import { router, useLocalSearchParams } from 'expo-router';
import { Archive, ArchiveRestore, MessageCircleQuestion } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { RichText } from '@/components/atoms/RichText';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { fromISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { assistantHref } from '@/features/assistant/assistantHref';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useZusData } from '@/features/zus/useZusData';
import { useSession } from '@/session';
import { useTheme } from '@/theme';

import { styles } from './DocumentScreen.styles';

/** Pismo z ZUS: „Co to oznacza?” (tłumacz pism), co trzeba zrobić, treść oryginału, archiwum. */
export function DocumentScreen() {
  const { colors } = useTheme();
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const { markDocumentRead, toggleDocumentArchived } = useSession();
  const zus = useZusData();
  const doc = zus?.documents.find((d) => d.id === documentId);
  const back = () => router.dismissTo(moreRoutes.messages);

  // Otwarcie pisma = przeczytane (stan w sesji, nie w tym ekranie).
  useEffect(() => {
    if (documentId) markDocumentRead(documentId);
  }, [documentId, markDocumentRead]);

  if (!doc) {
    return <ScreenLayout title="Nie ma takiego pisma" onBack={back} backLabel="Wiadomości" />;
  }

  return (
    <ScreenLayout
      title={doc.title}
      subtitle={`${doc.from} · ${formatDate(fromISODate(doc.date))}`}
      onBack={back}
      backLabel="Wiadomości"
    >
      <View style={styles.content}>
        <Card tone="accent" title="Co to oznacza? (tłumacz pism)">
          <AppText>{doc.summary}</AppText>
          <RichText text={`**Co musisz zrobić:** ${doc.todo}`} />
        </Card>
        <Card>
          <AppText variant="caption" color={colors.textMuted}>
            {doc.body}
          </AppText>
        </Card>
        <Button
          title="Zapytaj asystenta"
          variant="secondary"
          icon={MessageCircleQuestion}
          onPress={() => router.navigate(assistantHref(doc.title))}
        />
        <Button
          title={doc.isArchived ? 'Przywróć z archiwum' : 'Do archiwum'}
          variant="secondary"
          icon={doc.isArchived ? ArchiveRestore : Archive}
          onPress={() => toggleDocumentArchived(doc.id)}
        />
      </View>
    </ScreenLayout>
  );
}
