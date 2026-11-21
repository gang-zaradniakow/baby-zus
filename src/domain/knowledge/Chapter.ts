import type { ChapterId } from './Article';

export type Chapter = {
  id: ChapterId;
  title: string;
  /** Jedno zdanie o tym, co jest w rozdziale. */
  lead: string;
};
