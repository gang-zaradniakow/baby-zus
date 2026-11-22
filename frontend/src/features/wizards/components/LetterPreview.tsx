import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { formatDate } from '@/domain/dates/formatDate';
import type { Letter } from '@/domain/wizards/Wizard';
import { useTheme } from '@/theme';

import { styles } from './wizard.styles';

type Props = {
  letter: Letter;
  applicantName: string;
  date: Date;
};

/** Podgląd pisma do pracodawcy: miejsce i data, nadawca, adresat, tytuł, treść, załączniki, podpis. */
export function LetterPreview({ letter, applicantName, date }: Props) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLabel={`Pismo: ${letter.heading.join(' ')}`}
      style={[styles.letter, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <AppText variant="caption" style={styles.right}>
        Warszawa, {formatDate(date)}
      </AppText>
      <View>
        <AppText>{applicantName}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          (dane z profilu — zaślepka)
        </AppText>
      </View>
      <AppText variant="label" style={styles.right}>
        {letter.to}
      </AppText>
      <View>
        {letter.heading.map((line, i) => (
          <AppText key={i} variant="label" style={styles.centered}>
            {line}
          </AppText>
        ))}
      </View>
      {letter.paragraphs.map((paragraph, i) => (
        <AppText key={i}>{paragraph}</AppText>
      ))}
      {letter.attachments.length > 0 ? (
        <View>
          <AppText variant="label">Załączniki:</AppText>
          {letter.attachments.map((attachment, i) => (
            <AppText key={i} variant="caption">
              {i + 1}. {attachment}
            </AppText>
          ))}
        </View>
      ) : null}
      <AppText variant="caption" style={styles.signature}>
        ..........................................{'\n'}podpis
      </AppText>
    </View>
  );
}
