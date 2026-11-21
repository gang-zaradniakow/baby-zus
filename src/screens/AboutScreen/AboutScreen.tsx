import { router } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/atoms/Card';
import { RichText } from '@/components/atoms/RichText';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { LEGAL_BASIS } from '@/data/zusContact';
import { moreRoutes } from '@/features/more/moreRoutes';

import { styles } from './AboutScreen.styles';

/** O aplikacji: czym jest prototyp, zakres, co działa bez logowania, stan prawny, gdzie (nie) ma AI. */
export function AboutScreen() {
  return (
    <ScreenLayout
      title="O aplikacji"
      subtitle="mZUS dla Rodzica — prototyp."
      onBack={() => router.dismissTo(moreRoutes.home)}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        <Card>
          <RichText text="**Prototyp hackathonowy** (HackNation 2026). To **nie jest oficjalna aplikacja ZUS**. Logowanie, eZUS, PESEL i wysyłka wniosków to zaślepki; wszystkie dane są fikcyjne." />
          <RichText text="**Zakres:** wyłącznie świadczenia i sprawy z Poradnika ZUS dla rodziców i opiekunów dzieci — ubezpieczenie chorobowe, zasiłek chorobowy i świadczenie rehabilitacyjne w ciąży, zasiłek macierzyński za wszystkie urlopy, zasiłek opiekuńczy i pogrzebowy. Świadczenia gmin i programy rodzinne celowo pominięto." />
          <RichText text="**Bez logowania** działa zakładka Wiedza, ankieta z osią czasu, kalkulator i asystent. **Po zalogowaniu** dochodzą dane z eZUS i korespondencja z ZUS." />
          <RichText text={`**Stan prawny:** ${LEGAL_BASIS}. Źródła: Poradnik ZUS dla rodziców i opiekunów dzieci, Kodeks pracy, ustawa zasiłkowa, zus.pl, gov.pl.`} />
        </Card>
        <Card title="Sztuczna inteligencja">
          <RichText text="**W aplikacji nie ma AI.** Asystent to wyszukiwanie w lokalnej bazie wiedzy; kalkulator, terminy na osi czasu i wyszukiwarka Wiedzy działają na regułach z przepisów." />
          <RichText text="**AI w procesie twórczym:** kod przygotowano z pomocą Claude (Anthropic); treści pochodzą z materiałów ZUS." />
        </Card>
      </View>
    </ScreenLayout>
  );
}
