import type { ParentProfile, ParentStage } from '@/domain/profile/ParentProfile';

import { adoptionEntries } from './adoptionEntries';
import { childEntries } from './childEntries';
import { isTimelineInstitution } from './isTimelineInstitution';
import { planningEntries } from './planningEntries';
import { pregnancyEntries } from './pregnancyEntries';
import { resolveTimelineItem } from './resolveTimelineItem';
import { createTimelineContext, type TimelineContext } from './TimelineContext';
import type { TimelineEntry, TimelineItem } from './TimelineItem';

const ENTRY_RULES: Record<ParentStage, (context: TimelineContext) => TimelineEntry[]> = {
  planuje: planningEntries,
  ciaza: pregnancyEntries,
  dziecko: childEntries,
  adopcja: adoptionEntries,
};

/** Oś czasu dla profilu: reguły etapu → tylko pracodawca i ZUS → sortowanie po dacie → status każdej pozycji. */
export function buildTimeline(
  profile: ParentProfile,
  today: Date,
  completedIds: ReadonlySet<string>,
): TimelineItem[] {
  const entries = ENTRY_RULES[profile.stage](createTimelineContext(profile));

  return entries
    .filter((entry) => isTimelineInstitution(entry.institution))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((entry) => resolveTimelineItem(entry, today, completedIds.has(entry.id)));
}
