import { fromISODate, toISODate } from '@/domain/dates/calendarDate';
import type { Deadline, DeadlineRule } from '@/domain/deadlines/Deadline';

import type { DeadlineDto } from './apiTypes';
import { fetchJson } from './fetchJson';

/** Klucz reguły — do zapamiętywania odpowiedzi serwera (ta sama reguła = ten sam termin). */
export function deadlineRuleKey(rule: DeadlineRule): string {
  return `${toISODate(rule.event)}|${rule.kind}|${rule.days ?? ''}|${rule.months ?? ''}`;
}

/** Odpowiedź backendu → termin w modelu aplikacji (z zachowaną regułą). */
export function toDeadline(dto: DeadlineDto, rule: DeadlineRule): Deadline {
  return {
    kind: dto.type === 'BEFORE' ? 'before' : 'after',
    raw: fromISODate(dto.raw),
    legal: fromISODate(dto.legal),
    safe: fromISODate(dto.safe),
    shifted: dto.shifted,
    reason: dto.reason ?? null,
    rule,
  };
}

/**
 * `GET /api/v1/deadlines` — termin liczony przez backend z polskim kalendarzem świąt
 * (`event`, `type`, dokładnie jedno z `days` / `months`; `BEFORE` tylko z `days`).
 */
export async function fetchDeadline(rule: DeadlineRule): Promise<Deadline> {
  const dto = await fetchJson<DeadlineDto>('/api/v1/deadlines', {
    query: {
      event: toISODate(rule.event),
      type: rule.kind === 'before' ? 'BEFORE' : 'AFTER',
      days: rule.days,
      months: rule.kind === 'before' ? undefined : rule.months,
    },
  });
  return toDeadline(dto, rule);
}
