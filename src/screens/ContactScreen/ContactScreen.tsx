import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Mail, Phone, Video } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/atoms/AppText';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { LinkRow } from '@/components/molecules/LinkRow';
import { TextField } from '@/components/molecules/TextField';
import { ToggleChip } from '@/components/molecules/ToggleChip';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { E_VISIT_HOURS, E_VISIT_TOPICS, ZUS_CONTACT } from '@/data/zusContact';
import { toISODate } from '@/domain/dates/calendarDate';
import { formatDate, weekdayName } from '@/domain/dates/formatDate';
import { nextWorkingDays } from '@/domain/dates/nextWorkingDays';
import { moreRoutes } from '@/features/more/moreRoutes';
import { useToday } from '@/hooks/useToday';
import { useTheme } from '@/theme';

import { styles } from './ContactScreen.styles';

type Visit = { topic: string | null; day: string | null; time: string | null };

/** Kontakt z ZUS: rezerwacja e-wizyty (zaślepka), wiadomość na mama@zus.pl (zaślepka), infolinia. */
export function ContactScreen() {
  const { colors } = useTheme();
  const today = useToday();
  const days = nextWorkingDays(today, 5);
  const [visit, setVisit] = useState<Visit>({ topic: null, day: null, time: null });
  const [booked, setBooked] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);

  const canBook = visit.topic && visit.day && visit.time;
  const book = () => {
    if (!canBook) return;
    const dayLabel = formatDate(days.find((d) => toISODate(d) === visit.day) ?? today, true);
    setBooked((list) => [...list, `${visit.topic} · ${dayLabel}, ${visit.time}`]);
    setVisit({ topic: null, day: null, time: null });
  };

  return (
    <ScreenLayout
      title="Kontakt z ZUS"
      subtitle="e-Wizyta, e-mail dla rodziców i infolinia."
      onBack={() => router.dismissTo(moreRoutes.home)}
      backLabel="Więcej"
    >
      <View style={styles.content}>
        <Card title="Umów e-wizytę">
          <AppText variant="caption" color={colors.textMuted}>
            Rozmowa wideo z ekspertem ZUS (zaślepka rezerwacji).
          </AppText>
          <AppText variant="label">Temat</AppText>
          <View style={styles.chips}>
            {E_VISIT_TOPICS.map((topic) => (
              <ToggleChip key={topic} label={topic} selected={visit.topic === topic} onPress={() => setVisit((v) => ({ ...v, topic }))} />
            ))}
          </View>
          <AppText variant="label">Dzień</AppText>
          <View style={styles.chips}>
            {days.map((day) => {
              const iso = toISODate(day);
              return (
                <ToggleChip
                  key={iso}
                  label={`${weekdayName(day).slice(0, 3)} ${formatDate(day).slice(0, 5)}`}
                  selected={visit.day === iso}
                  onPress={() => setVisit((v) => ({ ...v, day: iso }))}
                />
              );
            })}
          </View>
          <AppText variant="label">Godzina</AppText>
          <View style={styles.chips}>
            {E_VISIT_HOURS.map((time) => (
              <ToggleChip key={time} label={time} selected={visit.time === time} onPress={() => setVisit((v) => ({ ...v, time }))} />
            ))}
          </View>
          <Button title="Zarezerwuj" icon={Video} onPress={book} disabled={!canBook} />
          {booked.map((entry) => (
            <AppText key={entry} variant="caption" color={colors.primary} accessibilityLiveRegion="polite">
              ✓ Zarezerwowano (zaślepka): {entry}
            </AppText>
          ))}
        </Card>

        <Card title={`Napisz na ${ZUS_CONTACT.parentsEmail}`}>
          <AppText variant="caption" color={colors.textMuted}>
            Skrzynka ZUS dla rodziców (od marca 2026). Pytania o Twoją indywidualną sprawę.
          </AppText>
          {messageSent ? (
            <AppText color={colors.primary} accessibilityLiveRegion="polite">
              Wiadomość przygotowana. W prototypie nic nie jest wysyłane — w produkcji trafi do zespołu ZUS z Twoim
              identyfikatorem sprawy.
            </AppText>
          ) : (
            <>
              <TextField
                multiline
                label="Treść"
                placeholder="Opisz krótko swoją sytuację. Nie podawaj danych medycznych, których nie musisz."
                value={message}
                onChangeText={setMessage}
              />
              <Button title="Wyślij (zaślepka)" icon={Mail} onPress={() => setMessageSent(true)} disabled={!message.trim()} />
            </>
          )}
        </Card>

        <LinkRow
          role="link"
          icon={Phone}
          title={`Infolinia ${ZUS_CONTACT.hotline}`}
          subtitle={`Centrum Kontaktu Klientów · ${ZUS_CONTACT.hotlineEmail}`}
          onPress={() => Linking.openURL(`tel:+48${ZUS_CONTACT.hotline.replace(/\s/g, '')}`)}
        />
      </View>
    </ScreenLayout>
  );
}
