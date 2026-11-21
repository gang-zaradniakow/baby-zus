import { addDays, addWeeks, diffDays } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { nextWorkingDay } from '@/domain/dates/workingDays';
import { deadlineBeforeDays } from '@/domain/deadlines/deadlines';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { answerDate, answerNumber, error } from '@/domain/wizards/wizardAnswers';

/** w-rodzicielski: część urlopu rodzicielskiego — wniosek do pracodawcy najpóźniej 21 dni przed. */
export const parentalLeaveWizard: WizardDefinition = {
  id: 'w-rodzicielski',
  title: 'Wniosek o urlop rodzicielski (część)',
  short: 'Do pracodawcy, 21 dni przed',
  intro: 'Urlop rodzicielski możesz podzielić na maksymalnie 5 części. Wniosek trafia do pracodawcy najpóźniej 21 dni przed startem.',
  institution: () => 'PRAC',
  steps: (ctx) => [
    {
      id: 'start',
      kind: 'date',
      question: 'Od kiedy chcesz zacząć tę część urlopu?',
      prefill: () => formatDate(nextWorkingDay(addDays(ctx.today, 22))),
      validate: (a) => {
        const start = answerDate(a, 'start');
        if (!start) return error('Podaj datę rozpoczęcia — wtedy sprawdzimy termin.');
        if (diffDays(ctx.today, deadlineBeforeDays(start, 21).raw) < 0) {
          return error(
            `Pracodawca musi dostać wniosek najpóźniej 21 dni wcześniej. Najwcześniejszy możliwy start przy złożeniu dziś: ${formatDate(addDays(ctx.today, 21))}.`,
          );
        }
        return null;
      },
    },
    {
      id: 'weeks',
      kind: 'number',
      question: 'Ile tygodni ma trwać ta część?',
      min: 1,
      max: 32,
      unit: 'tyg.',
      prefill: () => '8',
      validate: (a) => {
        const weeks = answerNumber(a, 'weeks');
        if (!weeks || weeks < 1) return error('Wpisz liczbę tygodni (co najmniej 1).');
        if (weeks > 32) {
          return error('Twoja część to maksymalnie 32 tygodnie (34 przy więcej dzieciach) — 9 tygodni należy do drugiego rodzica.');
        }
        return null;
      },
    },
    {
      id: 'part',
      kind: 'choice',
      question: 'Którą to będzie część urlopu rodzicielskiego?',
      hint: 'Liczą się też części wykorzystane przez drugiego rodzica.',
      options: [1, 2, 3, 4, 5, 6].map((i) => ({ value: String(i), label: `${i}. część` })),
      validate: (a) =>
        a.part === '6'
          ? error('Urlop rodzicielski można podzielić najwyżej na 5 części — wniosek o 6. część zostanie odrzucony. Połącz okresy albo zmień plan.')
          : null,
    },
    {
      id: 'work',
      kind: 'choice',
      question: 'Czy chcesz w tym czasie pracować na część etatu?',
      options: [
        { value: 'no', label: 'Nie' },
        { value: 'half', label: 'Tak, do ½ etatu', hint: 'Urlop wydłuży się proporcjonalnie, zasiłek będzie odpowiednio niższy.' },
      ],
    },
  ],
  build: (a, ctx) => {
    const start = answerDate(a, 'start') ?? ctx.today;
    const weeks = answerNumber(a, 'weeks') ?? 1;
    const end = addDays(addWeeks(start, weeks), -1);
    return {
      kind: 'letter',
      title: `Wniosek o urlop rodzicielski (${a.part}. część)`,
      letter: {
        to: 'Pracodawca — dział kadr',
        heading: ['WNIOSEK', 'o udzielenie urlopu rodzicielskiego'],
        paragraphs: [
          `Na podstawie art. 182¹ᵃ i art. 182¹ᵈ Kodeksu pracy wnoszę o udzielenie ${a.part}. części urlopu rodzicielskiego w wymiarze ${weeks} tygodni, w okresie od ${formatDate(start)} do ${formatDate(end)}, w celu sprawowania opieki nad dzieckiem: ${ctx.childName}.`,
          ...(a.work === 'half'
            ? ['Jednocześnie, na podstawie art. 182¹ᵉ § 2 KP, wnoszę o umożliwienie łączenia urlopu z pracą w wymiarze ½ etatu.']
            : []),
        ],
        attachments: ['Oświadczenie drugiego rodzica o (nie)korzystaniu z urlopu rodzicielskiego w tym okresie'],
      },
    };
  },
};
