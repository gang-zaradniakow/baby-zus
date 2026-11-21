import { router } from 'expo-router';

import { Button } from '@/components/atoms/Button';
import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { Timeline } from '@/features/timeline/components/Timeline';
import { useTimeline } from '@/features/timeline/useTimeline';
import { useSession } from '@/session';

export function StartScreen() {
  const { profile } = useSession();
  const { items, summary, toggleTask } = useTimeline();

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
