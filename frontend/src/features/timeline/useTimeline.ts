import { useMemo } from 'react';

import { deadlineRuleKey } from '@/api/deadlinesApi';
import type { DeadlineRule } from '@/domain/deadlines/Deadline';
import { describeStage } from '@/domain/profile/describeStage';
import { buildTimeline } from '@/domain/timeline/buildTimeline';
import { resolveTimelineItem } from '@/domain/timeline/resolveTimelineItem';
import { useToday } from '@/hooks/useToday';
import { useSession } from '@/session';

import { useServerDeadlines } from './useServerDeadlines';

/**
 * Łączy sesję (profil + zrobione zadania) z domeną: zwraca gotowe pozycje osi czasu. Terminy liczone
 * regułą potwierdza backend (`/api/v1/deadlines`) — jego wynik zastępuje lokalny, gdy przyjdzie.
 */
export function useTimeline() {
  const { profile, completedTaskIds, toggleTask } = useSession();
  const today = useToday();

  const localItems = useMemo(
    () => (profile ? buildTimeline(profile, today, completedTaskIds) : []),
    [profile, today, completedTaskIds],
  );

  const rules = useMemo(
    () => localItems.map((item) => item.deadline?.rule).filter((rule): rule is DeadlineRule => !!rule),
    [localItems],
  );
  const serverDeadlines = useServerDeadlines(rules);

  const items = useMemo(
    () =>
      localItems.map((item) => {
        const server = item.deadline?.rule && serverDeadlines.get(deadlineRuleKey(item.deadline.rule));
        return server ? resolveTimelineItem({ ...item, deadline: server }, today, item.status === 'done') : item;
      }),
    [localItems, serverDeadlines, today],
  );

  const summary = profile ? describeStage(profile, today) : '';

  return { items, summary, toggleTask };
}
