import type { Institution } from '@/domain/timeline/TimelineItem';
import type { Tone } from '@/theme';

export type InstitutionInfo = {
  label: string;
  tone: Tone;
};

/** Etykiety i kolory odznak instytucji (jak w prototypie: ZUS zielony, NFZ niebieski, reszta szara). */
export const INSTITUTIONS: Record<Institution, InstitutionInfo> = {
  ZUS: { label: 'ZUS', tone: 'primary' },
  NFZ: { label: 'NFZ', tone: 'info' },
  PRAC: { label: 'Pracodawca', tone: 'neutral' },
  GMINA: { label: 'Gmina / MOPS', tone: 'neutral' },
  USC: { label: 'USC / mObywatel', tone: 'neutral' },
  INFO: { label: 'Informacja', tone: 'neutral' },
};
