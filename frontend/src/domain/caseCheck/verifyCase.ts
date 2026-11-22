import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import type { CalcCheck } from '@/domain/calculator/CalcCheck';
import { addDays, diffDays } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { formatMoney } from '@/utils/formatMoney';

/** Rodzaj sprawy z dokumentów. */
export type CaseKind = 'maternity' | 'sickness' | 'paternity' | 'parental' | 'adoption';
export type CaseTitle = 'uop' | 'zlec' | 'jdg' | 'none';

export type CaseInput = {
  kind: CaseKind;
  title: CaseTitle;
  /** Ubezpieczenie chorobowe od / do (`null` w „do” — trwa). */
  insuredFrom: Date | null;
  insuredTo: Date | null;
  /** Data zdarzenia: poród, przyjęcie dziecka albo pierwszy dzień niezdolności do pracy. */
  eventDate: Date | null;
  /** Zadłużenie składkowe w dniu powstania prawa (firma). */
  debt: number;
  /** Płatnik zgłasza ponad 20 ubezpieczonych (stan na 30.11) — sam wypłaca zasiłek. */
  largePayer: boolean;
};

export type CaseVerification = {
  checks: CalcCheck[];
  /** Ubezpieczenie chorobowe w dniu zdarzenia. */
  insured: boolean;
  /** Świadczenie przysługuje (żadna kontrola nie blokuje). */
  eligible: boolean;
};

function whoPays({ title, largePayer, kind }: CaseInput): string | null {
  switch (title) {
    case 'jdg':
      return `ZUS (wniosek ${kind === 'sickness' ? 'ZAS-53' : 'ZAM'} bezpośrednio do ZUS)`;
    case 'zlec':
      return largePayer
        ? 'Płatnik składek (zleceniodawca) — sam ustala i wypłaca'
        : 'ZUS — zleceniodawca przekazuje wniosek i Z-3a';
    case 'uop':
      return largePayer ? 'Pracodawca — sam ustala i wypłaca zasiłek' : 'ZUS — pracodawca przekazuje wniosek i Z-3';
    case 'none':
      return null;
  }
}

/**
 * Weryfikacja sprawy z dokumentów (port `sprawaOut` z prototypu, bez odczytu PDF — dane wpisuje się
 * ręcznie): ubezpieczenie w dniu zdarzenia, okres wyczekiwania przy L4, zaległość w składkach firmy,
 * kto wypłaca i gdzie złożyć dokumenty.
 */
export function verifyCase(input: CaseInput, params: LegalParams = LEGAL_PARAMS): CaseVerification {
  const { kind, title, insuredFrom, insuredTo, eventDate } = input;
  const checks: CalcCheck[] = [];
  const eventLabel = eventDate ? formatDate(eventDate) : '—';
  const insured =
    title !== 'none' &&
    !!insuredFrom &&
    !!eventDate &&
    diffDays(insuredFrom, eventDate) >= 0 &&
    (!insuredTo || diffDays(eventDate, insuredTo) >= 0);

  if (insured) {
    checks.push({
      level: 'ok',
      text: `Ubezpieczenie chorobowe w dniu ${kind === 'sickness' ? 'powstania niezdolności' : 'zdarzenia'} (${eventLabel}): TAK.`,
    });
  } else {
    const exception =
      kind === 'maternity' || kind === 'adoption'
        ? ' (wyjątki: art. 30 — likwidacja lub upadłość pracodawcy w ciąży, umowa przedłużona do dnia porodu)'
        : '';
    checks.push({ level: 'no', text: `Brak ubezpieczenia chorobowego w dniu ${eventLabel} — świadczenie nie przysługuje${exception}.` });
  }

  if (kind === 'sickness' && insured && insuredFrom && eventDate) {
    const days = diffDays(insuredFrom, eventDate);
    const waiting = title === 'uop' ? params.sickness.waitingDaysMandatory : params.sickness.waitingDaysVoluntary;
    checks.push(
      days >= waiting
        ? { level: 'ok', text: `Okres wyczekiwania ${waiting} dni spełniony (${days} dni).` }
        : {
            level: 'no',
            text: `Okres wyczekiwania niespełniony: ${days} z ${waiting} dni — zasiłek przysługuje dopiero od ${formatDate(addDays(insuredFrom, waiting))}.`,
          },
    );
  }

  if (title === 'jdg') {
    checks.push(
      input.debt > params.debtLimit
        ? {
            level: 'no',
            text: `Zadłużenie ${formatMoney(input.debt)} > ${formatMoney(params.debtLimit)} — zasiłek wstrzymany do spłaty (art. 2a).`,
          }
        : { level: 'ok', text: 'Brak zadłużenia blokującego wypłatę.' },
    );
  }

  const payer = whoPays(input);
  if (payer) checks.push({ level: 'info', text: `Kto wypłaca i gdzie złożyć dokumenty: ${payer}.` });

  return { checks, insured, eligible: !checks.some((c) => c.level === 'no') };
}
