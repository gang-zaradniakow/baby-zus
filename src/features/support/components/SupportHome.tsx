import { router } from 'expo-router';
import { HeartHandshake } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { RichText } from '@/components/atoms/RichText';
import { LinkRow } from '@/components/molecules/LinkRow';
import { SUPPORT_ITEMS, type LossKind } from '@/data/support/supportItems';
import { ZUS_CONTACT } from '@/data/zusContact';
import { useTheme } from '@/theme';

import { styles } from './SupportHome.styles';

type Props = {
  kind: LossKind;
  onExit: () => void;
};

/**
 * Start w trybie wsparcia (port `vSupportHome`): bez odliczania i gratulacji — świadczenia po
 * stracie, urlop okolicznościowy, rozmowa z człowiekiem, organizacje; wyjście z trybu.
 */
export function SupportHome({ kind, onExit }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.content}>
      <Card tone="accent" title="Jesteśmy z Tobą">
        <AppText>
          Nie ma tu odliczania ani gratulacji. Poniżej tylko to, co może Ci teraz pomóc — w Twoim tempie.
        </AppText>
      </Card>

      <View style={styles.list}>
        {SUPPORT_ITEMS[kind].map((item) => (
          <LinkRow key={item.title} title={item.title} subtitle={item.description} onPress={() => router.push(item.href)} />
        ))}
      </View>

      <Card title="Urlop okolicznościowy">
        <AppText>Pracodawca udziela dni wolnych w związku ze śmiercią i pogrzebem dziecka.</AppText>
      </Card>

      <Card tone="info" title="Rozmowa z człowiekiem">
        <RichText
          text={`ZUS: **${ZUS_CONTACT.parentsEmail}**, e-wizyta, infolinia ${ZUS_CONTACT.hotline}.`}
        />
        <RichText text="Wsparcie emocjonalne: **116 123** (telefon zaufania dla dorosłych). W nagłej sytuacji: **112**." />
      </Card>

      <LinkRow
        icon={HeartHandshake}
        tone="accent"
        title="Organizacje, które pomagają po stracie"
        subtitle="Fundacje, stowarzyszenia, hospicja perinatalne"
        onPress={() => router.push('/wiecej/wsparcie')}
      />

      <Button title="To pomyłka / chcę wrócić do zwykłego widoku" variant="secondary" onPress={onExit} />
      <AppText variant="caption" color={colors.textMuted}>
        Tryb wsparcia włączony przez Ciebie. Możesz go wyłączyć w każdej chwili.
      </AppText>
    </View>
  );
}
