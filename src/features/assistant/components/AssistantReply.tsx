import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { RichText } from '@/components/atoms/RichText';
import { TextButton } from '@/components/atoms/TextButton';
import { ToggleChip } from '@/components/molecules/ToggleChip';
import { ZUS_CONTACT } from '@/data/zusContact';
import { ArticleBlockView } from '@/features/knowledge/components/ArticleBlockView';
import { resolveTone, useTheme } from '@/theme';

import type { ChatMessage, Feedback } from '../useAssistantChat';

import { styles } from './assistant.styles';

type Props = {
  message: Extract<ChatMessage, { role: 'assistant' }>;
  onAsk: (question: string) => void;
  onRate: (feedback: Feedback) => void;
};

/**
 * Odpowiedź Asystenta: treść z bazy wiedzy (bloki jak w Wiedzy), „Dla Ciebie”, przyciski do miejsc
 * w aplikacji, podobne pytania, źródło i ocena. Bez pewnej odpowiedzi — kontakt z ZUS zamiast zgadywania.
 */
export function AssistantReply({ message, onAsk, onRate }: Props) {
  const { colors } = useTheme();
  const { answer, personal, feedback } = message;
  const personalTone = resolveTone('accent', colors);

  return (
    <View style={[styles.bubble, styles.assistant, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {answer.kind === 'entry' ? (
        <>
          {personal ? (
            <View style={[styles.personal, { backgroundColor: personalTone.soft }]}>
              <RichText variant="caption" text={`**Dla Ciebie:** ${personal}`} />
            </View>
          ) : null}
          {answer.entry.answer.map((block, i) => (
            <ArticleBlockView key={i} block={block} />
          ))}
          {answer.entry.actions.length > 0 ? (
            <View style={styles.actions}>
              {answer.entry.actions.map((action) => (
                <TextButton key={action.href + action.label} title={action.label} onPress={() => router.push(action.href)} />
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <>
          <AppText>Nie mam pewnej odpowiedzi na to pytanie — wolę nie zgadywać w sprawach Twoich pieniędzy.</AppText>
          <RichText
            text={`Napisz do ZUS: **${ZUS_CONTACT.parentsEmail}**, umów **e-wizytę** albo zadzwoń: **${ZUS_CONTACT.hotline}**. Możesz też zapytać inaczej, np. „ile trwa urlop rodzicielski”.`}
          />
          <TextButton title="Kontakt z ZUS" onPress={() => router.push('/wiecej/kontakt')} />
        </>
      )}

      {answer.related.length > 0 ? (
        <View style={styles.related}>
          <AppText variant="caption" color={colors.textMuted}>
            {answer.kind === 'entry' ? 'Podobne pytania' : 'Może chodziło o:'}
          </AppText>
          <View style={styles.chips}>
            {answer.related.map((entry) => (
              <ToggleChip key={entry.id} label={entry.question} onPress={() => onAsk(entry.question)} />
            ))}
          </View>
        </View>
      ) : null}

      {answer.kind === 'entry' ? (
        <>
          <AppText variant="caption" color={colors.textMuted}>
            Źródło: {answer.entry.source}
          </AppText>
          <View style={styles.feedback}>
            <TextButton title={feedback === 'helpful' ? '✓ Pomocne' : 'Pomocne'} onPress={() => onRate('helpful')} />
            <TextButton
              title={feedback === 'notHelpful' ? '✓ Nie pomogło' : 'Nie pomogło'}
              onPress={() => onRate('notHelpful')}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}
