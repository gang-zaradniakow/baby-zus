import { addDays, addMonths, diffDays } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { nextWorkingDay } from '@/domain/dates/workingDays';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { answerDate, error } from '@/domain/wizards/wizardAnswers';

/** w-ojcowski: 2 tygodnie (w całości albo 2 × 7 dni), wniosek 7 dni przed, do 1. urodzin dziecka. */
export const paternityLeaveWizard: WizardDefinition = {
  id: 'w-ojcowski',
  title: 'Wniosek o urlop ojcowski',
  short: '2 tygodnie, 100%',
  intro: 'Urlop ojcowski trzeba wykorzystać przed pierwszymi urodzinami dziecka. Wniosek — 7 dni przed.',
  institution: () => 'PRAC',
  steps: (ctx) => [
    {
      id: 'parts',
      kind: 'choice',
      question: 'Jak chcesz wykorzystać urlop ojcowski?',
      options: [
        { value: '1', label: 'Jednorazowo — 14 dni' },
        { value: '2', label: 'W dwóch częściach po 7 dni' },
      ],
    },
    {
      id: 'start',
      kind: 'date',
      question: 'Od kiedy (pierwsza część)?',
      prefill: () => formatDate(nextWorkingDay(addDays(ctx.today, 8))),
      validate: (a) => {
        const start = answerDate(a, 'start');
        if (!start) return error('Podaj datę rozpoczęcia.');
        if (diffDays(ctx.today, start) < 7) {
          return error(
            `Wniosek musi trafić do pracodawcy co najmniej 7 dni przed urlopem. Najwcześniej: ${formatDate(addDays(ctx.today, 7))}.`,
          );
        }
        if (ctx.childBirth) {
          const limit = addMonths(ctx.childBirth, 12);
          const length = a.parts === '2' ? 7 : 14;
          if (diffDays(addDays(start, length), limit) < 0) {
            return error(
              `Urlop musi się skończyć przed ukończeniem przez dziecko 12 miesięcy (${formatDate(limit)}). Wybierz wcześniejszy termin.`,
            );
          }
        }
        return null;
      },
    },
  ],
  build: (a, ctx) => {
    const start = answerDate(a, 'start') ?? ctx.today;
    const length = a.parts === '2' ? 7 : 14;
    const end = addDays(start, length - 1);
    const born = ctx.childBirth ? ` (data urodzenia: ${formatDate(ctx.childBirth)})` : '';
    return {
      kind: 'letter',
      title: 'Wniosek o urlop ojcowski',
      letter: {
        to: 'Pracodawca — dział kadr',
        heading: ['WNIOSEK', 'o udzielenie urlopu ojcowskiego'],
        paragraphs: [
          `Na podstawie art. 182³ Kodeksu pracy wnoszę o udzielenie ${a.parts === '2' ? 'pierwszej części ' : ''}urlopu ojcowskiego w wymiarze ${length} dni, w okresie od ${formatDate(start)} do ${formatDate(end)}, w celu sprawowania opieki nad dzieckiem: ${ctx.childName}${born}.`,
        ],
        attachments: ['Skrócony odpis aktu urodzenia dziecka (do wglądu)'],
      },
    };
  },
};
