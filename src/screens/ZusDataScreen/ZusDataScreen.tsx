import { router } from 'expo-router';
import { Calculator } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { LoginRequired } from '@/features/more/components/LoginRequired';
import { MoreSection } from '@/features/more/components/MoreSection';
import { moreRoutes } from '@/features/more/moreRoutes';
import { SickLeaveRow } from '@/features/zus/components/SickLeaveRow';
import { ZusTitleRow } from '@/features/zus/components/ZusTitleRow';
import { useZusData } from '@/features/zus/useZusData';
import { useLegalParams } from '@/params';
import { useSession } from '@/session';
import { useTheme } from '@/theme';
import { formatMoney } from '@/utils/formatMoney';

import { styles } from './ZusDataScreen.styles';

/** Moje dane z ZUS (symulacja eZUS): ubezpieczenie chorobowe, tytuły, e-ZLA, zaległość — jak `vZus`. */
export function ZusDataScreen() {
  const { colors } = useTheme();
  const { isSignedIn } = useSession();
  const { params } = useLegalParams();
  const zus = useZusData();
  const back = () => router.dismissTo(moreRoutes.home);

  if (!isSignedIn || !zus) {
    return (
      <ScreenLayout title="Moje dane z ZUS" onBack={back} backLabel="Więcej">
        {isSignedIn ? (
          <Card>
            <AppText>Wypełnij ankietę albo wybierz osobę w Panelu demo — pokażemy dane z eZUS dla Twojej sytuacji.</AppText>
          </Card>
        ) : (
          <LoginRequired reason="Dane o ubezpieczeniu, e-ZLA i składkach pobierzemy z eZUS." />
        )}
      </ScreenLayout>
    );
  }

  const { account } = zus;
  const insured = account.hasSicknessInsurance;
  const blocked = account.debt > params.debtLimit;

  return (
    <ScreenLayout
      title="Moje dane z ZUS"
      subtitle="Symulacja pobrania danych z eZUS — dane fikcyjne."
      onBack={back}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        <Card tone={insured ? 'primary' : 'danger'} title={insured ? 'Masz ubezpieczenie chorobowe' : 'Nie masz ubezpieczenia chorobowego'}>
          <AppText variant="caption">
            {insured
              ? 'To warunek zasiłku chorobowego i macierzyńskiego. Liczy się stan w dniu porodu lub przyjęcia dziecka.'
              : 'Zasiłki z ubezpieczenia chorobowego nie przysługują. Przedsiębiorca i zleceniobiorca mogą zgłosić się do dobrowolnego chorobowego (ZUS ZUA) — nie wstecz.'}
          </AppText>
        </Card>

        <MoreSection title="Tytuły ubezpieczenia">
          {account.titles.length > 0 ? (
            account.titles.map((title) => <ZusTitleRow key={title.name} title={title} />)
          ) : (
            <AppText variant="caption" color={colors.textMuted}>
              Brak tytułów ubezpieczenia w eZUS.
            </AppText>
          )}
        </MoreSection>

        <MoreSection title="Zaświadczenia lekarskie e-ZLA">
          {account.certificates.length > 0 ? (
            account.certificates.map((c) => <SickLeaveRow key={c.number} certificate={c} />)
          ) : (
            <AppText variant="caption" color={colors.textMuted}>
              Brak zaświadczeń lekarskich.
            </AppText>
          )}
        </MoreSection>

        <MoreSection title="Stan rozliczeń ze składkami">
          <Card tone={blocked ? 'danger' : undefined}>
            <AppText variant="label">Zadłużenie: {formatMoney(account.debt)}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Próg blokujący zasiłek (1% płacy minimalnej): {formatMoney(params.debtLimit)}
            </AppText>
            <AppText variant="caption">
              {blocked
                ? 'Zaległość przekracza próg — zasiłek zostanie wypłacony dopiero po spłacie całości. Brak spłaty w 6 miesięcy od powstania prawa oznacza jego przedawnienie (art. 2a ustawy zasiłkowej).'
                : 'Brak zaległości blokujących wypłatę zasiłku.'}
            </AppText>
          </Card>
        </MoreSection>

        <Button title="Przelicz zasiłek na tych danych" icon={Calculator} onPress={() => router.navigate('/kalkulator')} />
      </View>
    </ScreenLayout>
  );
}
