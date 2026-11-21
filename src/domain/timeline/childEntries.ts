import { maternityLeaveWeeks } from '@/domain/calculator/maternityLeaveWeeks';
import { addDays, addMonths, addWeeks, endOfMonth } from '@/domain/dates/calendarDate';
import {
  deadlineAfterDays,
  deadlineAfterMonths,
  deadlineBeforeDays,
  deadlineOn,
} from '@/domain/deadlines/deadlines';

import type { TimelineContext } from './TimelineContext';
import type { TimelineEntry } from './TimelineItem';

/** Reguły osi czasu po narodzinach. `eventDate` = data urodzenia. */
export function childEntries({ eventDate: birth, insurance, tracksPartner, benefitPayer }: TimelineContext): TimelineEntry[] {
  const maternityWeeks = maternityLeaveWeeks(1);
  const firstBirthday = addMonths(birth, 12);

  const entries: TimelineEntry[] = [
    {
      id: 'usc',
      title: 'Zgłoś urodzenie w USC',
      description: 'Osobiście lub online. Dziecko dostanie PESEL.',
      institution: 'USC',
      date: addDays(birth, 21),
      deadline: deadlineAfterDays(birth, 21),
    },
  ];

  if (insurance.hasSicknessInsurance) {
    entries.push({
      id: 'w81',
      title: 'Wniosek o 81,5% (pełny wymiar urlopu)',
      description: 'Bez wniosku: 100% za macierzyński i 70% za rodzicielski.',
      institution: benefitPayer,
      date: addDays(birth, 21),
      deadline: deadlineAfterDays(birth, 21),
    });
  }

  entries.push(
    {
      id: 'nfz',
      title: 'Zgłoś dziecko do ubezpieczenia zdrowotnego (ZUS ZCNA)',
      description: insurance.hasEmploymentContract
        ? 'Przekaż dane dziecka pracodawcy — to on wysyła zgłoszenie.'
        : 'Przy firmie zgłaszasz samodzielnie w eZUS.',
      institution: insurance.hasEmploymentContract ? 'PRAC' : 'ZUS',
      date: addDays(birth, 7),
    },
    {
      id: '800',
      title: 'Wniosek o 800+ z wyrównaniem od urodzenia',
      institution: 'ZUS',
      date: addMonths(birth, 3),
      deadline: deadlineAfterMonths(birth, 3),
    },
  );

  if (!insurance.hasSicknessInsurance) {
    entries.push({
      id: 'swrodz',
      title: 'Świadczenie rodzicielskie 1000 zł (3 mies. na pełną kwotę)',
      institution: 'GMINA',
      date: addMonths(birth, 3),
      deadline: deadlineAfterMonths(birth, 3),
    });
  }

  entries.push({
    id: 'becikowe',
    title: 'Becikowe 1000 zł (próg 1922 zł/os.)',
    institution: 'GMINA',
    date: firstBirthday,
    deadline: deadlineAfterMonths(birth, 12),
  });

  if (insurance.hasSicknessInsurance) {
    entries.push(
      {
        id: 'mac-end',
        title: 'Koniec urlopu macierzyńskiego',
        institution: 'INFO',
        date: addWeeks(birth, maternityWeeks),
        milestone: true,
      },
      {
        id: 'rodz-1y',
        title: 'Min. 1 dzień rodzicielskiego przed 1. urodzinami',
        description: 'Warunek zachowania 81,5% (art. 31 ust. 3g).',
        institution: 'PRAC',
        date: addDays(firstBirthday, -1),
      },
    );
  }

  if (insurance.hasBusiness) {
    entries.push({
      id: 'zua',
      title: 'Po zasiłku: ponownie zgłoś się do chorobowego (ZUS ZUA)',
      description: 'Przy zasiłku macierzyńskim zostajesz automatycznie wyrejestrowana z dobrowolnego chorobowego.',
      institution: 'ZUS',
      date: addWeeks(birth, maternityWeeks + 32),
    });
  }

  if (tracksPartner) {
    const paternityLastStart = addDays(firstBirthday, -14);
    entries.push(
      {
        id: 'ojcowski',
        title: 'Urlop ojcowski taty — do 1. urodzin dziecka',
        description: '2 tygodnie, 100%. Wniosek 7 dni przed.',
        institution: 'PRAC',
        date: paternityLastStart,
        deadline: deadlineBeforeDays(paternityLastStart, 7),
      },
      {
        id: 'tata9',
        title: '9 tygodni rodzicielskiego dla taty (70%)',
        description: 'Nieprzenoszalne — przepadną, jeśli nie zostaną wykorzystane. Do końca roku, w którym dziecko kończy 6 lat.',
        institution: 'PRAC',
        date: addWeeks(birth, maternityWeeks + 4),
      },
    );
  }

  entries.push(
    {
      id: 'ar',
      title: 'Aktywny Rodzic — wniosek w miesiącu 1. urodzin',
      description: '„W pracy” i „w domu” — bez wyrównania wstecz.',
      institution: 'ZUS',
      date: firstBirthday,
      deadline: deadlineOn(endOfMonth(firstBirthday)),
    },
    {
      id: 'ar-end',
      title: 'Koniec Aktywnego Rodzica „w pracy” / „w domu”',
      institution: 'INFO',
      date: addMonths(birth, 36),
      milestone: true,
    },
  );

  return entries;
}
