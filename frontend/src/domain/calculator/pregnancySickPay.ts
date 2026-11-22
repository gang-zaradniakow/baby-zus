import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { formatMoney } from '@/utils/formatMoney';

import type { CalcCheck } from './CalcCheck';
import type { InsuranceTitleId } from './PersonTitles';

export type PregnancySickPayInput = {
  title: InsuranceTitleId | 'none';
  /** Podstawa wymiaru zasiłku (zł / mies.). */
  base: number;
  /** Ile dni L4 w ciąży liczymy. */
  days: number;
  /** Dni L4 już wykorzystane w tym roku (zmniejszają wynagrodzenie chorobowe od pracodawcy). */
  usedDays?: number;
  /** 50 lat lub więcej — pracodawca płaci krócej (14 dni). */
  age50?: boolean;
  /** Od ilu dni trwa ubezpieczenie chorobowe — okres wyczekiwania. */
  insuredDays?: number;
  /** Zaległość w składkach (firma). */
  debt?: number;
};

export type SickPayPart = {
  label: string;
  days: number;
  rate: number;
  amount: number;
};

export type PregnancySickPay = {
  checks: CalcCheck[];
  parts: SickPayPart[];
  /** Razem brutto. */
  total: number;
  /** Stawka dzienna (podstawa / 30). */
  daily: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value || 0));

/**
 * L4 w ciąży (kod B, 100%): na etacie najpierw wynagrodzenie chorobowe od pracodawcy (33 dni
 * w roku, od 50 lat — 14), potem zasiłek chorobowy do 270 dni okresu zasiłkowego, dalej świadczenie
 * rehabilitacyjne (do 12 mies.). Zlecenie i firma — zasiłek od 1. dnia. Port `chorobowyCiaza`.
 */
export function pregnancySickPay(input: PregnancySickPayInput, params: LegalParams = LEGAL_PARAMS): PregnancySickPay {
  const { sickness, rates } = params;
  if (input.title === 'none') {
    return {
      checks: [{ level: 'no', text: 'Brak ubezpieczenia chorobowego — zasiłek chorobowy nie przysługuje.' }],
      parts: [],
      total: 0,
      daily: 0,
    };
  }

  const checks: CalcCheck[] = [];
  const isEmployee = input.title === 'uop';
  const waitingDays = isEmployee ? sickness.waitingDaysMandatory : sickness.waitingDaysVoluntary;
  const insuredDays = input.insuredDays ?? 365;
  if (insuredDays < waitingDays) {
    checks.push({
      level: 'no',
      text: `Okres wyczekiwania: prawo do zasiłku po ${waitingDays} dniach ${isEmployee ? 'obowiązkowego' : 'dobrowolnego'} ubezpieczenia (masz ${insuredDays} dni). Pierwsze dni L4 mogą być bez zasiłku.`,
    });
  } else {
    checks.push({ level: 'ok', text: `Okres wyczekiwania (${waitingDays} dni) spełniony.` });
  }
  if (input.title === 'jdg' && (input.debt ?? 0) > params.debtLimit) {
    checks.push({ level: 'no', text: `Zaległość w składkach ${formatMoney(input.debt ?? 0)} — zasiłek wstrzymany do spłaty.` });
  }

  const daily = (input.base || 0) / 30;
  const totalDays = clamp(input.days, 0, 2000);
  const period = sickness.pregnancyPeriodDays;
  const parts: SickPayPart[] = [];
  let remaining = totalDays;

  if (isEmployee) {
    const employerDays = input.age50 ? sickness.employerPaidDaysAge50 : sickness.employerPaidDays;
    const limit = Math.max(0, employerDays - clamp(input.usedDays ?? 0, 0, 400));
    const days = Math.min(remaining, limit, period);
    if (days > 0) parts.push({ label: 'Wynagrodzenie chorobowe (płaci pracodawca)', days, rate: 1, amount: daily * days });
    remaining -= days;
  }

  const sicknessDays = Math.min(remaining, Math.max(0, period - (totalDays - remaining)));
  if (sicknessDays > 0) {
    parts.push({
      label: isEmployee ? 'Zasiłek chorobowy (płatnik lub ZUS)' : 'Zasiłek chorobowy (od 1. dnia — ZUS lub płatnik)',
      days: sicknessDays,
      rate: rates.pregnancySickness,
      amount: daily * sicknessDays * rates.pregnancySickness,
    });
  }
  remaining -= sicknessDays;

  if (remaining > 0) {
    const days = Math.min(remaining, sickness.rehabilitationMaxMonths * 30);
    parts.push({
      label: 'Świadczenie rehabilitacyjne (po 270 dniach, decyzja lekarza orzecznika)',
      days,
      rate: rates.pregnancyRehabilitation,
      amount: daily * days * rates.pregnancyRehabilitation,
    });
  }

  return { checks, parts, total: parts.reduce((sum, part) => sum + part.amount, 0), daily };
}
