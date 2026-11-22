import { Send } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { typography, useTheme } from '@/theme';

import { styles } from './assistant.styles';

type Props = { onSend: (text: string) => void };

/** Pole pytania z przyciskiem „Wyślij” (także klawisz Enter). */
export function ChatComposer({ onSend }: Props) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  return (
    <View style={styles.composer}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={send}
        placeholder="Zadaj pytanie…"
        placeholderTextColor={colors.textMuted}
        maxLength={500}
        returnKeyType="send"
        accessibilityLabel="Twoje pytanie"
        style={[
          styles.composerInput,
          typography.body,
          { borderColor: colors.border, backgroundColor: colors.surface, color: colors.textPrimary },
        ]}
      />
      <Pressable
        onPress={send}
        disabled={!canSend}
        accessibilityRole="button"
        accessibilityLabel="Wyślij"
        accessibilityState={{ disabled: !canSend }}
        style={[styles.send, { backgroundColor: canSend ? colors.primary : colors.track }]}
      >
        <Send color={colors.onPrimary} size={20} />
      </Pressable>
    </View>
  );
}
