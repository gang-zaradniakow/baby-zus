import { addDays, addMonths, addWeeks } from '@/domain/dates/calendarDate';
import { deadlineAfterDays, deadlineBeforeDays } from '@/domain/deadlines/deadlines';

import type { TimelineContext } from './TimelineContext';
import type { TimelineEntry } from './TimelineItem';

/** Reguły osi czasu w ciąży. `eventDate` = przewidywany termin porodu. */
export function pregnancyEntries({ eventDate: due, insurance, benefitPayer }: TimelineContext): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    {
      id: 'opieka10',
      title: 'Potwierdzenie opieki medycznej od 10. tygodnia',
      description: 'Warunek becikowego — poproś lekarza lub położną.',
      institution: 'NFZ',
      date: addWeeks(due, -30),
    },
    {
      id: 'polozna',
      title: 'Bezpłatna edukacja przedporodowa (od 21. tyg.)',
      description: 'Spotkania z położną w ramach NFZ.',
      institution: 'NFZ',
      date: addWeeks(due, -19),
    },
  ];

  if (insurance.hasSicknessInsurance) {
    const leaveStart = addWeeks(due, -6);
    entries.push(
      {
        id: 'mac-przed',
        title: 'Opcjonalnie: urlop macierzyński przed porodem',
        description: 'Maks. 6 tygodni przed terminem. Wniosek + zaświadczenie o terminie porodu.',
        institution: insurance.hasEmploymentContract ? 'PRAC' : 'ZUS',
        date: leaveStart,
        deadline: deadlineBeforeDays(leaveStart, 14),
      },
      {
        id: 'w81-plan',
        title: 'Decyzja: 81,5% czy 100% + 70%',
        description: 'Liczone od faktycznej daty porodu: 21 dni.',
        institution: benefitPayer,
        date: addDays(due, 21),
        deadline: deadlineAfterDays(due, 21),
        estimate: true,
      },
    );
  }

  entries.push(
    {
      id: 'usc',
      title: 'Zgłoszenie urodzenia w USC (21 dni)',
      description: 'Osobiście lub online (gov.pl).',
      institution: 'USC',
      date: addDays(due, 21),
      estimate: true,
    },
    {
      id: '800',
      title: 'Wniosek o 800+ (3 miesiące na wyrównanie)',
      institution: 'ZUS',
      date: addMonths(due, 3),
      estimate: true,
    },
  );

  if (!insurance.hasSicknessInsurance) {
    entries.push({
      id: 'swrodz',
      title: 'Świadczenie rodzicielskie 1000 zł — wniosek w gminie',
      description: 'Nie masz chorobowego, więc zamiast zasiłku macierzyńskiego.',
      institution: 'GMINA',
      date: addMonths(due, 3),
      estimate: true,
    });
  }

  entries.push({
    id: 'becikowe',
    title: 'Becikowe — wniosek do 12 miesięcy',
    institution: 'GMINA',
    date: addMonths(due, 12),
    estimate: true,
  });

  return entries;
}
