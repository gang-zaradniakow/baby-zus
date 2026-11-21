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
import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { describeParamChanges } from '@/features/admin/describeParamChanges';
import { EDITABLE_PARAM_GROUPS } from '@/features/admin/editableParams';
import { MoreSection } from '@/features/more/components/MoreSection';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useLegalParams } from '@/params';
import { useTheme } from '@/theme';

import { styles } from './AdminScreen.styles';

/** Hasło demonstracyjne z prototypu — w produkcji logowanie pracownika ZUS i role. */
const DEMO_PASSWORD = 'zus2026';

/** „14:05” bez Intl (Hermes na Androidzie nie zawsze ma polskie dane lokalizacji). */
const formatTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/**
 * Panel administracyjny (mock): zmiana parametrów prawnych bez zmiany kodu — zapis obowiązuje od razu
 * we wszystkich kalkulatorach. Bez REST (prototyp: `PUT /api/params`); rejestr zmian w pamięci.
 */
export function AdminScreen() {
  const { colors } = useTheme();
  const { params, save, reset, changeLog } = useLegalParams();
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
        {EDITABLE_PARAM_GROUPS.map((group) => (
          <Card key={group.title} title={group.title}>
            {group.fields.map((field) => (
              <NumberField
                key={field.id}
                label={field.get(params) !== field.get(LEGAL_PARAMS) ? `${field.label} (zmienione)` : field.label}
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
            setDraft(LEGAL_PARAMS);
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
