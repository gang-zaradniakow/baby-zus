import { ScreenLayout } from '@/components/templates/ScreenLayout';
import { Timeline } from '@/features/timeline/components/Timeline';
import { useTimeline } from '@/features/timeline/useTimeline';

export function StartScreen() {
  const { items, summary, toggleTask } = useTimeline();

  return (
    <ScreenLayout title="Oś czasu" subtitle={summary}>
      <Timeline items={items} onToggleTask={toggleTask} />
    </ScreenLayout>
  );
}
