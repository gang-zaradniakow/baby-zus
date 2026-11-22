import type { Institution } from './TimelineItem';

/** Oś czasu pokazuje tylko sprawy załatwiane u pracodawcy i w ZUS — reszta (NFZ, USC, gmina) jest poza zakresem. */
const TIMELINE_INSTITUTIONS: ReadonlySet<Institution> = new Set(['PRAC', 'ZUS']);

export const isTimelineInstitution = (institution: Institution) => TIMELINE_INSTITUTIONS.has(institution);
