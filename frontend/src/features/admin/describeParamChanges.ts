import type { LegalParams } from '@/data/legalParams';

import { EDITABLE_PARAM_GROUPS } from './editableParams';

/** Opis zmian do rejestru, np. „Urlop rodzicielski: 0,7 → 0,75”. Pusty tekst — nic się nie zmieniło. */
export function describeParamChanges(before: LegalParams, after: LegalParams): string {
  const pl = (value: number) => String(value).replace('.', ',');
  return EDITABLE_PARAM_GROUPS.flatMap((group) => group.fields)
    .filter((field) => field.get(before) !== field.get(after))
    .map((field) => `${field.label}: ${pl(field.get(before))} → ${pl(field.get(after))}`)
    .join('; ');
}
