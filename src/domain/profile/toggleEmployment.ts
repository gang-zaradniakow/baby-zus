import { toggleInList } from '@/utils/toggleInList';

import type { EmploymentId } from './ParentProfile';

const NO_INSURANCE: EmploymentId = 'brak';

/**
 * Formy zatrudnienia można łączyć (np. etat + firma), ale „Brak ubezpieczenia”
 * wyklucza pozostałe — zaznaczenie go czyści resztę i odwrotnie.
 */
export function toggleEmployment(current: readonly EmploymentId[], id: EmploymentId): EmploymentId[] {
  if (id === NO_INSURANCE) {
    return current.includes(NO_INSURANCE) ? [] : [NO_INSURANCE];
  }
  return toggleInList(current.filter((x) => x !== NO_INSURANCE), id);
}
