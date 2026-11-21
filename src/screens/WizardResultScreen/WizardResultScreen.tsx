import { router, useLocalSearchParams } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import { Share, View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { formatDate } from '@/domain/dates/formatDate';
import { letterToText } from '@/domain/wizards/letterToText';
import { moreRoutes } from '@/features/more/moreRoutes';
import { LetterPreview } from '@/features/wizards/components/LetterPreview';
import { styles } from '@/features/wizards/components/wizard.styles';
import { useSession } from '@/session';
import { useTheme } from '@/theme';
import { formatTime } from '@/utils/formatTime';

/** Wynik kreatora (port vResult): gotowe pismo do kadr z udostępnieniem albo potwierdzenie wniosku z UPO. */
export function WizardResultScreen() {
  const { colors } = useTheme();
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const { sentDocuments } = useSession();
  const document = sentDocuments.find((d) => d.id === documentId);
  const back = () => router.dismissTo(moreRoutes.messages);

  if (!document) {
    return <ScreenLayout title="Nie ma takiego dokumentu" onBack={back} backLabel="Wiadomości" />;
  }

  if (document.kind === 'letter') {
    const share = () =>
      Share.share({ title: document.title, message: letterToText(document.letter, document.applicantName, document.createdAt) });
    return (
      <ScreenLayout title="Gotowe pismo" subtitle={document.title} onBack={back} backLabel="Wiadomości">
        <View style={styles.content}>
          <Card tone="primary" title="Pismo jest gotowe">
            <AppText variant="caption">
              Wydrukuj je albo wyślij do kadr (osobiście albo mailem). To nie trafia do ZUS — to częsty błąd, który tu
              eliminujemy.
            </AppText>
          </Card>
          {document.note ? (
            <Card tone="info">
              <AppText variant="caption">{document.note}</AppText>
            </Card>
          ) : null}
          <LetterPreview letter={document.letter} applicantName={document.applicantName} date={document.createdAt} />
          <Button title="Udostępnij / wyślij do kadr" icon={Share2} onPress={share} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Wniosek wysłany" subtitle={document.title} onBack={back} backLabel="Wiadomości">
      <View style={styles.content}>
        <Card tone="primary" title={`Wniosek przyjęty (symulacja: ${document.destination})`}>
          <AppText variant="caption">W prototypie nic nie trafia do urzędu.</AppText>
        </Card>
        <Card>
          <AppText variant="caption" color={colors.textMuted}>
            Formularz
          </AppText>
          <AppText variant="label">{document.form}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Data i godzina
          </AppText>
          <AppText variant="label">
            {formatDate(document.createdAt)}, {formatTime(document.createdAt)}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            Nr UPO
          </AppText>
          <AppText variant="label">{document.upo}</AppText>
          <AppText>{document.summary}</AppText>
        </Card>
        <AppText variant="caption" color={colors.textMuted}>
          UPO — Urzędowe Poświadczenie Odbioru. Zapisaliśmy je w Wiadomościach → Moje dokumenty.
        </AppText>
        <Button title="Wróć na Start" variant="secondary" onPress={() => router.navigate('/')} />
      </View>
    </ScreenLayout>
  );
}
