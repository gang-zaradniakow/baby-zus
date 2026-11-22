import type { ParentProfile } from '@/domain/profile/ParentProfile';

/** Profil do testów z rozsądnymi domyślnymi wartościami; nadpisz tylko to, co ważne w teście. */
export function makeProfile(overrides: Partial<ParentProfile> = {}): ParentProfile {
  return {
    role: 'mama',
    stage: 'dziecko',
    eventDate: '2026-11-01',
    childrenCount: 1,
    employment: ['uop'],
    partner: 'track',
    special: [],
    ...overrides,
  };
}
