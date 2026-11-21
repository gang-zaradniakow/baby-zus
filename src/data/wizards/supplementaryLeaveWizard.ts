import { maternityLeaveWeeks } from '@/domain/calculator/maternityLeaveWeeks';
import { supplementaryLeaveWeeks } from '@/domain/calculator/supplementaryLeaveWeeks';
import { addDays, addWeeks, diffDays } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import { deadlineBeforeDays } from '@/domain/deadlines/deadlines';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { answerDate, answerNumber, error } from '@/domain/wizards/wizardAnswers';

/** w-uzupelniajacy: uzupełniający urlop macierzyński (wcześniak, szpital) — 21 dni przed końcem macierzyńskiego. */
export const supplementaryLeaveWizard: WizardDefinition = {
  id: 'w-uzupelniajacy',
  title: 'Wniosek o uzupełniający urlop macierzyński',
  short: 'Wcześniaki i hospitalizacja, 100%',
  intro:
    'Tydzień urlopu za każdy tydzień pobytu dziecka w szpitalu. Wniosek — najpóźniej 21 dni przed końcem urlopu macierzyńskiego.',
  institution: () => 'PRAC',
  steps: (ctx) => [
    {
      id: 'tc',
      kind: 'number',
      question: 'W którym tygodniu ciąży urodziło się dziecko?',
      min: 20,
      max: 43,
      prefill: () => '36',
      validate: (a) => (answerNumber(a, 'tc') ? null : error('Podaj tydzień ciąży z karty wypisowej.')),
    },
    {
      id: 'waga',
      kind: 'number',
      question: 'Jaka była masa urodzeniowa (w gramach)?',
      min: 300,
      max: 6000,
      unit: 'g',
      prefill: () => '2500',
      validate: (a) => (answerNumber(a, 'waga') ? null : error('Podaj masę urodzeniową.')),
    },
    {
      id: 'dni',
      kind: 'number',
      question: 'Ile dni dziecko było w szpitalu (do 8./15. tygodnia po porodzie)?',
      min: 0,
      max: 105,
      unit: 'dni',
      prefill: () => '14',
    },
    {
      id: 'end',
      kind: 'date',
      question: 'Kiedy kończy się Twój urlop macierzyński?',
      prefill: () =>
        ctx.childBirth
          ? formatDate(addDays(addWeeks(ctx.childBirth, maternityLeaveWeeks(ctx.childrenCount, ctx.params)), -1))
          : '',
      validate: (a) => {
        const end = answerDate(a, 'end');
        if (!end) return error('Podaj datę końca urlopu macierzyńskiego.');
        const deadline = deadlineBeforeDays(end, 21).raw;
        if (diffDays(ctx.today, deadline) < 0) {
          return error(
            `Termin na wniosek minął ${formatDate(deadline)} (21 dni przed końcem urlopu). Zadzwoń do kadr albo napisz na mama@zus.pl — sprawdzimy, co da się zrobić.`,
          );
        }
        return null;
      },
    },
    {
      id: 'cert',
      kind: 'document',
      question: 'Dołącz zaświadczenie ze szpitala',
      hint: 'Musi zawierać okres pobytu dziecka oraz tydzień ciąży lub masę urodzeniową.',
    },
    {
      id: 'other',
      kind: 'choice',
      question: 'Drugi rodzic',
      options: [
        { value: 'stmt', label: 'Drugi rodzic złoży oświadczenie, że nie skorzysta z tego urlopu' },
        { value: 'single', label: 'Wychowuję dziecko samodzielnie' },
      ],
    },
  ],
  build: (a, ctx) => {
    const leave = supplementaryLeaveWeeks(
      {
        gestationWeek: answerNumber(a, 'tc') ?? 36,
        birthWeightGrams: answerNumber(a, 'waga') ?? 2500,
        hospitalDays: answerNumber(a, 'dni') ?? 0,
      },
      ctx.params,
    );
    const maternityEnd = answerDate(a, 'end') ?? ctx.today;
    const start = addDays(maternityEnd, 1);
    const end = addDays(addWeeks(start, leave.weeks), -1);
    return {
      kind: 'letter',
      title: `Wniosek o uzupełniający urlop macierzyński (${leave.weeks} tyg.)`,
      note: leave.rule,
      letter: {
        to: 'Pracodawca — dział kadr',
        heading: ['WNIOSEK', 'o udzielenie uzupełniającego urlopu macierzyńskiego'],
        paragraphs: [
          `Na podstawie art. 180² Kodeksu pracy wnoszę o udzielenie uzupełniającego urlopu macierzyńskiego w wymiarze ${leave.weeks} tygodni, bezpośrednio po zakończeniu urlopu macierzyńskiego (kończącego się ${formatDate(maternityEnd)}), tj. w okresie od ${formatDate(start)} do ${formatDate(end)}.`,
          `Dziecko urodziło się w ${a.tc}. tygodniu ciąży z masą urodzeniową ${a.waga} g i przebywało w szpitalu ${a.dni} dni.`,
        ],
        attachments: [
          'Zaświadczenie ze szpitala o okresie pobytu dziecka i tygodniu ciąży / masie urodzeniowej',
          a.other === 'single'
            ? 'Oświadczenie o samodzielnym wychowywaniu dziecka'
            : 'Oświadczenie drugiego rodzica o niekorzystaniu z uzupełniającego urlopu macierzyńskiego',
        ],
      },
    };
  },
};
