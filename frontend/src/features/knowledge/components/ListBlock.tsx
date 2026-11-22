import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { RichText } from '@/components/atoms/RichText';
import { useTheme } from '@/theme';

import { styles } from './ListBlock.styles';

type Props = {
  items: readonly string[];
  ordered: boolean;
};

/** Lista punktowana albo numerowana. */
export function ListBlock({ items, ordered }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <AppText variant="label" color={colors.primary} style={styles.marker}>
            {ordered ? `${i + 1}.` : '•'}
          </AppText>
          <View style={styles.text}>
            <RichText text={item} />
          </View>
        </View>
      ))}
    </View>
  );
}
