import { addDays, addWeeks, diffDays } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { answerDate, error, warning } from '@/domain/wizards/wizardAnswers';

/** w-adopcja: urlop na warunkach macierzyńskiego — wniosek w 7 dni od przyjęcia, start do 21 dni od przyjęcia. */
export const adoptionLeaveWizard: WizardDefinition = {
  id: 'w-adopcja',
  title: 'Wniosek o urlop na warunkach urlopu macierzyńskiego',
  short: 'Adopcja / rodzina zastępcza',
  intro: 'Wniosek składasz w ciągu 7 dni od przyjęcia dziecka. Urlop zaczyna się najpóźniej 21 dni od przyjęcia.',
  institution: () => 'PRAC',
  steps: (ctx) => [
    {
      id: 'type',
      kind: 'choice',
      question: 'Na jakiej podstawie przyjmujesz dziecko?',
      options: [
        { value: 'adop', label: 'Wystąpiliśmy do sądu o przysposobienie', hint: 'Dziecko do 14 lat' },
        { value: 'rz', label: 'Rodzina zastępcza (niezawodowa)', hint: 'Dziecko do 7 lat (10 przy odroczeniu obowiązku szkolnego)' },
        { value: 'zaw', label: 'Zawodowa rodzina zastępcza' },
      ],
      validate: (a) =>
        a.type === 'zaw'
          ? error('Zawodowej rodzinie zastępczej urlop na warunkach urlopu macierzyńskiego nie przysługuje. Zapytaj PCPR o inne formy wsparcia.')
          : null,
    },
    {
      id: 'taken',
      kind: 'date',
      question: 'Kiedy przyjęliście dziecko?',
      prefill: () => (ctx.adoptionDate ? formatDate(ctx.adoptionDate) : ''),
      validate: (a) => {
        const taken = answerDate(a, 'taken');
        if (!taken) return error('Podaj datę przyjęcia dziecka — od niej liczymy terminy.');
        const days = diffDays(taken, ctx.today);
        return days > 7
          ? warning(`Od przyjęcia minęło ${days} dni, a wniosek składa się w ciągu 7 dni. Złóż go jak najszybciej i porozmawiaj z kadrami.`)
          : null;
      },
    },
    {
      id: 'start',
      kind: 'date',
      question: 'Od kiedy ma się zacząć urlop?',
      prefill: () => formatDate(ctx.today),
      validate: (a) => {
        const start = answerDate(a, 'start');
        if (!start) return error('Podaj datę rozpoczęcia urlopu.');
        const taken = answerDate(a, 'taken');
        if (!taken) return error('Wróć i podaj datę przyjęcia dziecka.');
        const limit = addDays(taken, 21);
        return diffDays(start, limit) < 0
          ? error(`Urlop musi się zacząć najpóźniej 21 dni od przyjęcia dziecka (${formatDate(limit)}).`)
          : null;
      },
    },
  ],
  build: (a, ctx) => {
    const start = answerDate(a, 'start') ?? ctx.today;
    const taken = answerDate(a, 'taken') ?? ctx.today;
    const weeks = 20;
    const end = addDays(addWeeks(start, weeks), -1);
    const adoption = a.type === 'adop';
    return {
      kind: 'letter',
      title: 'Wniosek o urlop na warunkach urlopu macierzyńskiego',
      letter: {
        to: 'Pracodawca — dział kadr',
        heading: ['WNIOSEK', 'o udzielenie urlopu na warunkach urlopu macierzyńskiego'],
        paragraphs: [
          `Na podstawie art. 183 § ${adoption ? '1¹' : '1'} Kodeksu pracy wnoszę o udzielenie urlopu na warunkach urlopu macierzyńskiego w wymiarze ${weeks} tygodni, w okresie od ${formatDate(start)} do ${formatDate(end)}, w związku z przyjęciem dziecka na wychowanie w dniu ${formatDate(taken)}${adoption ? ' i wystąpieniem do sądu opiekuńczego z wnioskiem o wszczęcie postępowania w sprawie przysposobienia' : ' jako rodzina zastępcza'}.`,
        ],
        attachments: [
          adoption
            ? 'Zaświadczenie sądu opiekuńczego o wszczęciu postępowania w sprawie przysposobienia'
            : 'Orzeczenie sądu o umieszczeniu dziecka w rodzinie zastępczej / zaświadczenie PCPR',
        ],
      },
    };
  },
};
