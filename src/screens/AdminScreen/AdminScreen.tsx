import { router } from 'expo-router';
import { Check, LogIn, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { NumberField } from '@/components/molecules/NumberField';
import { TextField } from '@/components/molecules/TextField';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import type { LegalParams } from '@/data/legalParams';
import { fromISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { describeParamChanges } from '@/features/admin/describeParamChanges';
import { EDITABLE_PARAM_GROUPS } from '@/features/admin/editableParams';
import { MoreSection } from '@/features/more/components/MoreSection';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useLegalParams } from '@/params';
import { useTheme } from '@/theme';
import { formatTime } from '@/utils/formatTime';

import { styles } from './AdminScreen.styles';

/** Hasło demonstracyjne z prototypu — w produkcji logowanie pracownika ZUS i role. */
const DEMO_PASSWORD = 'zus2026';


/**
 * Panel administracyjny (mock): zmiana parametrów prawnych bez zmiany kodu — zapis obowiązuje od razu
 * we wszystkich kalkulatorach. Wartości domyślne przychodzą z backendu (`GET /api/v1/legal-parameters`);
 * zmiany są lokalne, w pamięci — backend nie ma jeszcze zapisu parametrów.
 */
export function AdminScreen() {
  const { colors } = useTheme();
  const { params, defaults, source, save, reset, changeLog } = useLegalParams();
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [draft, setDraft] = useState<LegalParams>(params);
  const back = () => router.dismissTo(moreRoutes.home);

  if (!loggedIn) {
    return (
      <ScreenLayout title="Panel administracyjny" onBack={back} backLabel="Więcej">
        <Card>
          <AppText>
            Panel dla pracowników ZUS: zmiana parametrów prawnych (stopy, kwoty, wymiary) bez zmiany kodu — po nowelizacji
            przepisów.
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            W produkcji: logowanie pracownika, role, rejestr zmian i data obowiązywania. W demo hasło: {DEMO_PASSWORD}.
          </AppText>
          <TextField label="Hasło" value={password} onChangeText={setPassword} />
          <Button
            title="Zaloguj"
            icon={LogIn}
            disabled={password !== DEMO_PASSWORD}
            onPress={() => {
              setDraft(params);
              setLoggedIn(true);
            }}
          />
        </Card>
      </ScreenLayout>
    );
  }

  const changes = describeParamChanges(params, draft);

  return (
    <ScreenLayout
      title="Parametry prawne"
      subtitle="Zmiany obowiązują od razu we wszystkich kalkulatorach."
      onBack={back}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        <Card tone={source.kind === 'server' ? 'info' : 'accent'}>
          <AppText variant="caption">
            {source.kind === 'server'
              ? `Wartości domyślne z serwera: wersja ${source.version}, obowiązuje od ${formatDate(fromISODate(source.validFrom))}. Zmiany poniżej są lokalne (demo).`
              : 'Brak połączenia z serwerem — wartości domyślne z aplikacji. Zmiany poniżej są lokalne (demo).'}
          </AppText>
        </Card>
        {EDITABLE_PARAM_GROUPS.map((group) => (
          <Card key={group.title} title={group.title}>
            {group.fields.map((field) => (
              <NumberField
                key={field.id}
                label={field.get(params) !== field.get(defaults) ? `${field.label} (zmienione)` : field.label}
                value={field.get(draft)}
                onChange={(value) => setDraft((d) => field.set(d, value))}
              />
            ))}
          </Card>
        ))}

        <Button title="Zapisz parametry" icon={Check} disabled={!changes} onPress={() => save(draft, changes)} />
        <Button
          title="Przywróć domyślne"
          variant="secondary"
          icon={RotateCcw}
          onPress={() => {
            reset();
            setDraft(defaults);
          }}
        />

        {changeLog.length > 0 ? (
          <MoreSection title="Rejestr zmian">
            {changeLog.slice(0, 8).map((entry, i) => (
              <AppText key={i} variant="caption">
                {formatTime(entry.at)} — {entry.description}
              </AppText>
            ))}
          </MoreSection>
        ) : null}
      </View>
    </ScreenLayout>
  );
}
