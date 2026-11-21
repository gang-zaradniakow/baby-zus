import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

import type { CalcCheck } from './CalcCheck';
import { TITLE_LABELS } from './PersonTitles';
import { pregnancySickPay, type PregnancySickPayInput, type SickPayPart } from './pregnancySickPay';
import type { PersonResolution } from './resolvePerson';

export type SickPayOptions = Omit<PregnancySickPayInput, 'title' | 'base'>;

export type ConcurrentSickPay = {
  checks: CalcCheck[];
  parts: SickPayPart[];
  total: number;
};

/**
 * L4 w ciąży przy kilku tytułach: każdy tytuł liczony osobno (etat — najpierw pracodawca,
 * zlecenie/firma — zasiłek od 1. dnia), kwoty się sumują. Port `chorobowyMulti`.
 */
export function concurrentTitlesSickPay(
  person: PersonResolution,
  options: SickPayOptions,
  params: LegalParams = LEGAL_PARAMS,
): ConcurrentSickPay {
  const result: ConcurrentSickPay = { checks: [...person.checks], parts: [], total: 0 };

  if (person.parts.length === 0) {
    if (!result.checks.some((c) => c.level === 'no')) {
      result.checks.push({ level: 'no', text: 'Brak ubezpieczenia chorobowego — zasiłek chorobowy nie przysługuje.' });
    }
    return result;
  }

  const several = person.parts.length > 1;
  for (const part of person.parts) {
    const prefix = several ? `${TITLE_LABELS[part.title]}: ` : '';
    const sub = pregnancySickPay({ ...options, title: part.title, base: part.base }, params);
    for (const check of sub.checks) {
      if (check.level !== 'ok') result.checks.push({ ...check, text: prefix + check.text });
    }
    for (const subPart of sub.parts) {
      result.parts.push({ ...subPart, label: several ? `${TITLE_LABELS[part.title]} — ${subPart.label}` : subPart.label });
    }
    result.total += sub.total;
  }
  return result;
}
