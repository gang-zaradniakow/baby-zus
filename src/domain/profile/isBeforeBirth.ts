import type { ParentStage } from './ParentProfile';

/** Czy dziecka jeszcze nie ma na świecie (planowanie albo ciąża) — wtedy np. nie pytamy o imię dziecka. */
export function isBeforeBirth(stage: ParentStage): boolean {
  return stage === 'planuje' || stage === 'ciaza';
}
