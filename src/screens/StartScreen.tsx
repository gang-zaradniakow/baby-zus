import { router } from 'expo-router';

import { Button } from '@/components/atoms/Button';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { SupportHome } from '@/features/support/components/SupportHome';
import { Timeline } from '@/features/timeline/components/Timeline';
import { useTimeline } from '@/features/timeline/useTimeline';
import { useSession } from '@/session';

export function StartScreen() {
  const { profile, supportMode, setSupportMode } = useSession();
  const { items, summary, toggleTask } = useTimeline();

  // Tryb wsparcia po stracie: zamiast osi czasu z odliczaniem — tylko to, co pomaga.
  if (supportMode !== 'none') {
    return (
      <ScreenLayout title="Start">
        <SupportHome kind={supportMode} onExit={() => setSupportMode('none')} />
      </ScreenLayout>
    );
  }

  if (!profile) {
    return (
      <ScreenLayout title="Start" subtitle="Sprawdź, co Ci przysługuje — bez logowania.">
        <Button title="Sprawdź bez logowania" onPress={() => router.push('/onboarding')} />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Oś czasu" subtitle={summary}>
      <Timeline items={items} onToggleTask={toggleTask} />
    </ScreenLayout>
  );
}
