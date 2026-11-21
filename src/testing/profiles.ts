import type { ParentProfile } from '@/domain/profile/ParentProfile';

/** Profil do testów z rozsądnymi domyślnymi wartościami; nadpisz tylko to, co ważne w teście. */
export function makeProfile(overrides: Partial<ParentProfile> = {}): ParentProfile {
  return {
    stage: 'dziecko',
    eventDate: '2026-11-01',
    employment: ['uop'],
    special: [],
    ...overrides,
  };
}
