import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { ExternalLink, HeartHandshake, Phone } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Card } from '@/components/atoms/Card';
import { LinkRow } from '@/components/molecules/LinkRow';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { HELPLINES, SUPPORT_ORGANIZATIONS, USEFUL_LINKS } from '@/data/supportOrganizations';
import { MoreSection } from '@/features/more/components/MoreSection';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useTheme } from '@/theme';

import { styles } from './SupportScreen.styles';

/** Organizacje wspierające rodziców w trudnych sytuacjach, telefony wsparcia i przydatne strony. */
export function SupportScreen() {
  const { colors } = useTheme();
  const open = (url: string) => Linking.openURL(url);

  return (
    <ScreenLayout
      title="Wsparcie i organizacje"
      subtitle="Pomoc po stracie dziecka, przy wcześniaku i ciężkiej chorobie dziecka."
      onBack={() => router.dismissTo(moreRoutes.home)}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        <MoreSection title="Organizacje">
          {SUPPORT_ORGANIZATIONS.map(({ name, topic, url }) =>
            url ? (
              <LinkRow
                key={name}
                role="link"
                icon={HeartHandshake}
                tone="accent"
                title={name}
                subtitle={topic}
                onPress={() => open(url)}
              />
            ) : (
              <Card key={name}>
                <AppText variant="label">{name}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {topic}
                </AppText>
              </Card>
            ),
          )}
        </MoreSection>

        <MoreSection title="Telefony wsparcia">
          {HELPLINES.map((line) => (
            <LinkRow
              key={line.number}
              role="link"
              icon={Phone}
              title={line.number}
              subtitle={line.description}
              onPress={() => open(`tel:${line.number.replace(/\s/g, '')}`)}
            />
          ))}
        </MoreSection>

        <MoreSection title="Przydatne strony">
          {USEFUL_LINKS.map((link) => (
            <LinkRow
              key={link.url}
              role="link"
              icon={ExternalLink}
              title={link.label}
              subtitle={link.url.replace('https://', '')}
              onPress={() => open(link.url)}
            />
          ))}
        </MoreSection>

        <AppText variant="caption" color={colors.textMuted}>
          Lista organizacji do weryfikacji przez ZUS przed wdrożeniem (aktualność danych kontaktowych).
        </AppText>
      </View>
    </ScreenLayout>
  );
}
