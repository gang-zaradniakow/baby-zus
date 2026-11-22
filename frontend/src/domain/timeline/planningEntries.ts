import { addDays, addMonths, addWeeks } from '@/domain/dates/calendarDate';

import type { TimelineContext } from './TimelineContext';
import type { TimelineEntry } from './TimelineItem';

/** Ciąża trwa ok. 40 tygodni — od planowanego terminu liczymy orientacyjny początek ciąży. */
const PREGNANCY_WEEKS = 40;
/** Okres wyczekiwania na zasiłek chorobowy przy dobrowolnym ubezpieczeniu (firma, zlecenie). */
const VOLUNTARY_WAITING_DAYS = 90;

/**
 * Reguły osi czasu przy planowaniu dziecka. `eventDate` = planowany termin porodu,
 * więc wszystkie daty są orientacyjne.
 */
export function planningEntries({ eventDate: planned, insurance, benefitPayer }: TimelineContext): TimelineEntry[] {
  const pregnancyStart = addWeeks(planned, -PREGNANCY_WEEKS);
  const entries: TimelineEntry[] = [
    {
      id: 'plan-podstawa',
      title: 'Od tych 12 miesięcy zależy wysokość zasiłku',
      description:
        'Zasiłek liczy się ze średniej z 12 miesięcy przed L4 albo porodem. Zmiana pracy lub pensji w tym czasie zmienia kwotę — sprawdź w kalkulatorze.',
      institution: benefitPayer,
      date: addMonths(pregnancyStart, -12),
      estimate: true,
    },
  ];

  if (insurance.hasBusiness || insurance.hasCivilContract) {
    entries.push({
      id: 'plan-chorobowe',
      title: 'Dobrowolne ubezpieczenie chorobowe — z wyprzedzeniem',
      description: `Na L4 w ciąży z firmy lub zlecenia trzeba mieć dobrowolne chorobowe od co najmniej ${VOLUNTARY_WAITING_DAYS} dni (zgłoszenie ZUS ZUA). Zasiłek macierzyński nie ma okresu wyczekiwania.`,
      institution: 'ZUS',
      date: addDays(pregnancyStart, -VOLUNTARY_WAITING_DAYS),
      estimate: true,
    });
  }

  if (insurance.hasEmploymentContract) {
    entries.push({
      id: 'plan-umowa',
      title: 'Umowa na czas określony a ciąża',
      description:
        'Umowa zawarta na dłużej niż miesiąc, która skończyłaby się po 3. miesiącu ciąży, przedłuża się do dnia porodu. Przekaż pracodawcy zaświadczenie lekarskie o ciąży.',
      institution: 'PRAC',
      date: addWeeks(pregnancyStart, 12),
      estimate: true,
    });
  }

  return entries;
}
