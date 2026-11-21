import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';
import { formatMoney } from '@/utils/formatMoney';

import type { CalcCheck } from './CalcCheck';
import { TITLE_LABELS, type InsuranceTitleId, type PersonTitles } from './PersonTitles';

export type TitlePart = { title: InsuranceTitleId; base: number };

export type PersonResolution = {
  /** Główny tytuł, z którego liczymy zasiłek; `none` — brak ubezpieczenia chorobowego w ZUS. */
  title: InsuranceTitleId | 'none';
  /** Suma podstaw ze wszystkich tytułów, które dają zasiłek. */
  base: number;
  /** Tytuły dające zasiłek — każdy liczony osobno (zbieg tytułów). */
  parts: TitlePart[];
  checks: CalcCheck[];
  krus: boolean;
  /** Zaległość blokująca zasiłek, gdy firma jest jedynym tytułem (komunikat poda symulacja). */
  debt: number;
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Zbieg tytułów do ubezpieczeń (Poradnik ZUS 2026, s. 9–14): z których tytułów osoba ma
 * ubezpieczenie chorobowe i jaka jest podstawa zasiłku. Port `resolvePerson` z prototypu.
 */
export function resolvePerson(titles: PersonTitles, params: LegalParams = LEGAL_PARAMS): PersonResolution {
  const { uop, zlec, jdg, krus } = titles;
  const isKrus = !!krus?.on;
  const checks: CalcCheck[] = [];
  const parts: TitlePart[] = [];
  let businessBlocked = false;

  if (!uop?.on && !zlec?.on && !jdg?.on) {
    if (isKrus) {
      checks.push({ level: 'no', text: 'Rolnik w KRUS: zasiłki wypłaca KRUS, nie ZUS — kwota poniżej jest orientacyjna.' });
    }
    return { title: 'none', base: 0, parts, checks, krus: isKrus, debt: 0 };
  }

  const employmentAtMinWage = !!uop?.on && uop.atLeastMinWage !== false;

  if (uop?.on) {
    let base = uop.base || 0;
    if (employmentAtMinWage && base > 0 && base < params.minBenefitBase) {
      base = params.minBenefitBase;
      checks.push({
        level: 'info',
        text: `Etat: podstawa podniesiona do minimum ${formatMoney(params.minBenefitBase)} (płaca minimalna − 13,71%).`,
      });
    }
    parts.push({ title: 'uop', base });
  }

  /** Tytuł z dobrowolnym chorobowym (zlecenie, firma). */
  const addVoluntary = (id: 'zlec' | 'jdg') => {
    const label = TITLE_LABELS[id];
    if (employmentAtMinWage) {
      checks.push({
        level: 'info',
        text: `Etat z co najmniej płacą minimalną + ${label}: z tytułu „${label}” nie ma ubezpieczenia chorobowego — zasiłek tylko z etatu.`,
      });
      return;
    }
    if (id === 'zlec' && zlec?.student) {
      checks.push({ level: 'info', text: 'Student lub uczeń do 26 lat na zleceniu nie podlega ubezpieczeniom — z tego tytułu zasiłku nie ma.' });
      return;
    }
    if (id === 'jdg' && jdg?.startRelief) {
      checks.push({
        level: 'info',
        text: 'Ulga na start: przez 6 miesięcy firma nie podlega ubezpieczeniom społecznym — z tego tytułu zasiłku nie ma.',
      });
      return;
    }
    const title = id === 'zlec' ? zlec : jdg;
    if (!title?.voluntarySickness) {
      checks.push({ level: 'info', text: `${capitalize(label)}: bez dobrowolnego chorobowego — z tego tytułu zasiłek nie przysługuje.` });
      return;
    }
    let base = title.base || 0;
    if (base > params.maxVoluntaryBase) {
      base = params.maxVoluntaryBase;
      checks.push({
        level: 'info',
        text: `${capitalize(label)}: zastosowano limit podstawy dobrowolnego chorobowego ${formatMoney(params.maxVoluntaryBase)}.`,
      });
    }
    if (id === 'jdg' && (jdg?.debt ?? 0) > params.debtLimit) {
      businessBlocked = true;
      checks.push({
        level: 'no',
        text: `Firma: zaległość ${formatMoney(jdg!.debt)} > ${formatMoney(params.debtLimit)} — zasiłek z firmy wstrzymany do spłaty; brak spłaty w 6 mies. = utrata prawa.`,
      });
      return;
    }
    parts.push({ title: id, base });
  };

  if (zlec?.on && jdg?.on && !employmentAtMinWage) {
    // Zleceniobiorca z firmą: dobrowolne chorobowe tylko z tytułu objętego obowiązkowo.
    const civilAtMinWage = (zlec.base || 0) / (1 - params.socialContributionRate) >= params.minWage;
    const main = civilAtMinWage ? 'zlec' : 'jdg';
    const other = civilAtMinWage ? 'jdg' : 'zlec';
    addVoluntary(main);
    checks.push({
      level: 'info',
      text: `Zlecenie + firma: obowiązkowo ubezpieczasz się z tytułu „${TITLE_LABELS[main]}”${civilAtMinWage ? ' (zlecenie co najmniej z płacą minimalną)' : ''}, więc dobrowolne chorobowe — tylko z niego. Z tytułu „${TITLE_LABELS[other]}” zasiłku nie ma.`,
    });
  } else {
    if (zlec?.on) addVoluntary('zlec');
    if (jdg?.on) addVoluntary('jdg');
  }

  if (isKrus) {
    checks.push({
      level: 'info',
      text: uop?.on
        ? 'Etat + gospodarstwo: z etatu podlegasz ZUS — zasiłek z ZUS liczymy z etatu.'
        : 'KRUS + firma: jeśli zostajesz w KRUS (warunki ustawy o ubezpieczeniu rolników), zasiłek wypłaca KRUS. Kalkulator liczy wariant z ubezpieczeniem w ZUS.',
    });
  }

  // Sama firma z zaległością: komunikat poda symulacja (art. 2a) — bez powtórzenia.
  if (businessBlocked && parts.length === 0) {
    const index = checks.findIndex((c) => c.level === 'no' && c.text.startsWith('Firma: zaległość'));
    if (index >= 0) checks.splice(index, 1);
  }

  const base = parts.reduce((sum, part) => sum + part.base, 0);
  if (parts.length > 1) {
    checks.push({
      level: 'ok',
      text: `Zasiłek z ${parts.length} tytułów — każdy liczony osobno: ${parts.map((p) => `${TITLE_LABELS[p.title]} ${formatMoney(p.base)}`).join(' + ')}.`,
    });
  }
  if (parts.length === 0 && !businessBlocked) {
    checks.push({ level: 'no', text: 'Żaden z tytułów nie daje ubezpieczenia chorobowego — zasiłek z ZUS nie przysługuje.' });
  }
  if (parts.length > 0 && !base) {
    checks.push({ level: 'no', text: 'Wpisz podstawę zasiłku — bez niej nie policzymy kwoty.' });
  }

  const title: PersonResolution['title'] = parts.some((p) => p.title === 'uop')
    ? 'uop'
    : parts.some((p) => p.title === 'jdg')
      ? 'jdg'
      : parts.length > 0
        ? 'zlec'
        : businessBlocked
          ? 'jdg'
          : 'none';

  return {
    title,
    base,
    parts,
    checks,
    krus: isKrus,
    debt: businessBlocked && parts.length === 0 ? (jdg?.debt ?? 0) : 0,
  };
}
