import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { RichText } from '@/components/atoms/RichText';
import { useTheme } from '@/theme';

import { styles } from './TableBlock.styles';

type Props = {
  header: readonly string[];
  rows: readonly (readonly string[])[];
};

/**
 * Tabela z Poradnika w wersji na telefon: każdy wiersz to osobna kartka —
 * pierwsza komórka jako tytuł, kolejne z podpisem kolumny. Na wąskim ekranie czyta się to lepiej
 * niż dwie wąskie kolumny długiego tekstu.
 */
export function TableBlock({ header, rows }: Props) {
  const { colors } = useTheme();
  const [, ...valueColumns] = header;

  return (
    <View style={styles.table}>
      {rows.map(([first, ...values], i) => (
        <View key={i} style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="caption" color={colors.textMuted}>
            {header[0]}
          </AppText>
          <RichText text={first} variant="label" />
          {values.map((value, j) => (
            <View key={j} style={styles.cell}>
              <AppText variant="caption" color={colors.textMuted}>
                {valueColumns[j]}
              </AppText>
              <RichText text={value} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
