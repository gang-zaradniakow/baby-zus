import type { SpecialSituationId } from '@/domain/profile/ParentProfile';

export type SpecialSituationOption = {
  id: SpecialSituationId;
  label: string;
};

export const SPECIAL_SITUATION_OPTIONS: readonly SpecialSituationOption[] = [
  { id: 'abroad', label: 'Jeden z rodziców pracuje za granicą (UE)' },
  { id: 'disability', label: 'Dziecko z orzeczeniem o niepełnosprawności' },
  { id: 'preterm', label: 'Wcześniak / dziecko w szpitalu' },
  { id: 'zazyciem', label: 'Zaświadczenie „Za życiem”' },
];
