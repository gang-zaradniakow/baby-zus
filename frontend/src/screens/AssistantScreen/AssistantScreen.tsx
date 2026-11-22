import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { ToggleChip } from '@/components/molecules/ToggleChip';
import { ScreenHeader } from '@/components/molecules/ScreenHeader';
import { StepLayout } from '@/components/templates/StepLayout';
import { styles as chatStyles } from '@/features/assistant/components/assistant.styles';
import { AssistantReply } from '@/features/assistant/components/AssistantReply';
import { ChatComposer } from '@/features/assistant/components/ChatComposer';
import { useAssistantChat } from '@/features/assistant/useAssistantChat';
import { useTheme } from '@/theme';

/**
 * Zakładka „Asystent”: rozmowa z lokalną bazą wiedzy (bez AI, działa offline) — jak `vAssistant`.
 * `?pytanie=` zadaje pytanie od razu (np. z Wiedzy przy braku wyników albo z pisma z ZUS).
 */
export function AssistantScreen() {
  const { colors } = useTheme();
  const { pytanie } = useLocalSearchParams<{ pytanie?: string }>();
  const chat = useAssistantChat();

  // Zakładka zostaje zamontowana — każde nowe pytanie z adresu trafia do rozmowy.
  const [lastQuestion, setLastQuestion] = useState<string | undefined>(undefined);
  if (pytanie && pytanie !== lastQuestion) {
    setLastQuestion(pytanie);
    chat.ask(pytanie);
  }

  return (
    <StepLayout
      autoScrollToEnd
      header={<ScreenHeader title="Asystent" subtitle="Odpowiedzi z bazy wiedzy ZUS dla rodziców — bez AI, ze źródłem." />}
      footer={<ChatComposer onSend={chat.ask} />}
    >
      <View style={chatStyles.list}>
        <View style={[chatStyles.bubble, chatStyles.assistant, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText>
            Cześć{chat.greetingName ? `, ${chat.greetingName}` : ''}! O co chcesz zapytać? Odpowiadam na podstawie Poradnika ZUS
            dla rodziców — nie wydaję decyzji, rozstrzyga ZUS.
          </AppText>
        </View>

        {chat.messages.map((message) =>
          message.role === 'user' ? (
            <View key={message.id} style={[chatStyles.bubble, chatStyles.user, { backgroundColor: colors.primary }]}>
              <AppText color={colors.onPrimary}>{message.text}</AppText>
            </View>
          ) : (
            <AssistantReply
              key={message.id}
              message={message}
              onAsk={chat.ask}
              onRate={(feedback) => chat.rate(message.id, feedback)}
            />
          ),
        )}

        {chat.messages.length < 2 ? (
          <View style={chatStyles.chips}>
            {chat.suggestions.map((question) => (
              <ToggleChip key={question} label={question} onPress={() => chat.ask(question)} />
            ))}
          </View>
        ) : null}
      </View>
    </StepLayout>
  );
}
