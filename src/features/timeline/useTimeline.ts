import { useMemo } from 'react';

import { describeStage } from '@/domain/profile/describeStage';
import { buildTimeline } from '@/domain/timeline/buildTimeline';
import { useToday } from '@/hooks/useToday';
import { useSession } from '@/session';

/** Łączy sesję (profil + zrobione zadania) z domeną: zwraca gotowe pozycje osi czasu. */
export function useTimeline() {
  const { profile, completedTaskIds, toggleTask } = useSession();
  const today = useToday();

  const items = useMemo(
    () => (profile ? buildTimeline(profile, today, completedTaskIds) : []),
    [profile, today, completedTaskIds],
  );

  const summary = profile ? describeStage(profile, today) : '';

  return { items, summary, toggleTask };
}
