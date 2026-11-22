import { maternityLeaveWeeks } from '@/domain/calculator/maternityLeaveWeeks';
import { parentalLeaveWeeks } from '@/domain/calculator/parentalLeaveWeeks';
import { addWeeks, diffDays } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { answerDate, answerNumber, error, warning } from '@/domain/wizards/wizardAnswers';

/** Urlop macierzyński można zacząć najwcześniej 6 tygodni przed przewidywaną datą porodu (art. 180 § 3 KP). */
export const MAX_WEEKS_BEFORE_DUE = 6;

/**
 * w-macierzynski-szkic: szkic wniosku o urlop i zasiłek macierzyński, przygotowany jeszcze w ciąży.
 * Nic nie jest wysyłane — po porodzie wystarczy uzupełnić datę porodu i złożyć wniosek.
 */
export const maternityDraftWizard: WizardDefinition = {
  id: 'w-macierzynski-szkic',
  title: 'Szkic wniosku o zasiłek macierzyński (w ciąży)',
  short: 'Przygotuj teraz, złóż po porodzie',
  intro:
    'Przygotujesz wniosek już teraz, w spokoju. Zapiszemy go jako szkic — po porodzie uzupełnisz datę porodu i złożysz go. Na wariant 81,5% masz 21 dni od porodu.',
  institution: (ctx) => (ctx.businessOnly ? 'ZUS' : 'PRAC'),
  draft: true,
  steps: (ctx) => [
    {
      id: 'due',
      kind: 'date',
      question: 'Jaki jest przewidywany termin porodu?',
      hint: 'Z zaświadczenia lekarskiego albo karty ciąży.',
      prefill: () => (ctx.dueDate ? formatDate(ctx.dueDate) : ''),
      validate: (a) => {
        const due = answerDate(a, 'due');
        if (!due) return error('Podaj przewidywany termin porodu.');
        if (diffDays(ctx.today, due) < 0) {
          return warning('Ten termin już minął. Jeśli dziecko jest na świecie, skorzystaj z wniosku „Zasiłek 81,5%”.');
        }
        return null;
      },
    },
    {
      id: 'weeksBefore',
      kind: 'number',
      question: 'Ile tygodni przed terminem chcesz zacząć urlop macierzyński?',
      hint: `0 — od dnia porodu. Najwcześniej ${MAX_WEEKS_BEFORE_DUE} tygodni przed terminem.`,
      min: 0,
      max: MAX_WEEKS_BEFORE_DUE,
      unit: 'tyg.',
      prefill: () => '0',
      validate: (a) => {
        const weeks = answerNumber(a, 'weeksBefore');
        if (weeks === null || !Number.isInteger(weeks) || weeks < 0) return error('Podaj liczbę pełnych tygodni (0 = od porodu).');
        if (weeks > MAX_WEEKS_BEFORE_DUE) {
          return error(`Przed porodem można wykorzystać najwyżej ${MAX_WEEKS_BEFORE_DUE} tygodni urlopu macierzyńskiego.`);
        }
        return null;
      },
    },
    {
      id: 'count',
      kind: 'choice',
      question: 'Ilu dzieci się spodziewasz?',
      hint: 'Przy ciąży mnogiej urlop jest dłuższy.',
      prefill: () => String(ctx.childrenCount),
      options: [
        { value: '1', label: 'Jednego' },
        { value: '2', label: 'Bliźniąt' },
        { value: '3', label: 'Trojga' },
        { value: '4', label: 'Czworga' },
        { value: '5', label: 'Pięciorga lub więcej' },
      ],
    },
    {
      id: 'variant',
      kind: 'choice',
      question: 'Jak chcesz pobierać zasiłek?',
      options: [
        {
          value: '815',
          label: 'Od razu macierzyński + rodzicielski — 81,5% przez cały okres',
          hint: 'Wniosek trzeba złożyć najpóźniej 21 dni po porodzie.',
        },
        { value: '100', label: 'Na razie sam macierzyński — 100%', hint: 'Rodzicielski (70%) możesz złożyć później.' },
      ],
    },
  ],
  build: (a, ctx) => {
    const count = Number(a.count) || 1;
    const due = answerDate(a, 'due') ?? ctx.today;
    const weeksBefore = Math.min(Math.max(answerNumber(a, 'weeksBefore') ?? 0, 0), MAX_WEEKS_BEFORE_DUE);
    const maternity = maternityLeaveWeeks(count, ctx.params);
    const parental = parentalLeaveWeeks(count, false, ctx.params) - ctx.params.nonTransferableWeeks;
    const averaged = a.variant === '815';
    const start =
      weeksBefore > 0
        ? `od dnia ${formatDate(addWeeks(due, -weeksBefore))}, tj. ${weeksBefore} tyg. przed przewidywaną datą porodu (${formatDate(due)})`
        : `od dnia porodu (przewidywana data porodu: ${formatDate(due)})`;

    const exclusion = `Wniosek nie obejmuje części przysługującej wyłącznie drugiemu rodzicowi (${ctx.params.nonTransferableWeeks} tygodni).`;
    const paragraphs = ctx.businessOnly
      ? [
          averaged
            ? `Wnoszę o wypłatę zasiłku macierzyńskiego za okres odpowiadający ${maternity} tygodniom urlopu macierzyńskiego i ${parental} tygodniom urlopu rodzicielskiego, ${start}, w wysokości 81,5% podstawy wymiaru. ${exclusion}`
            : `Wnoszę o wypłatę zasiłku macierzyńskiego za okres odpowiadający ${maternity} tygodniom urlopu macierzyńskiego, ${start}, w wysokości 100% podstawy wymiaru.`,
        ]
      : [
          `Na podstawie art. 180 Kodeksu pracy wnoszę o udzielenie urlopu macierzyńskiego w wymiarze ${maternity} tygodni ${start}.`,
          averaged
            ? `Jednocześnie wnoszę o udzielenie, bezpośrednio po urlopie macierzyńskim, urlopu rodzicielskiego w wymiarze ${parental} tygodni oraz o wypłatę zasiłku macierzyńskiego za cały ten okres w wysokości 81,5% podstawy wymiaru. ${exclusion}`
            : 'Wnoszę o wypłatę zasiłku macierzyńskiego za okres urlopu macierzyńskiego w wysokości 100% podstawy wymiaru.',
        ];
    const attachments = [
      ...(weeksBefore > 0 ? ['Zaświadczenie lekarskie o przewidywanej dacie porodu'] : []),
      'Skrócony odpis aktu urodzenia dziecka (po porodzie) albo zgoda na pobranie go przez ZUS z rejestru USC',
    ];
    const whereToFile = ctx.businessOnly ? 'w eZUS na formularzu ZAM' : 'u pracodawcy (w kadrach)';

    return {
      kind: 'letter',
      title: `Szkic: wniosek o urlop i zasiłek macierzyński${averaged ? ' (81,5%)' : ''}`,
      note: `To szkic przygotowany w ciąży. Po porodzie wpisz rzeczywistą datę porodu i złóż go ${whereToFile}${averaged ? ' — najpóźniej 21 dni po porodzie, żeby zachować 81,5%' : ''}.`,
      letter: {
        to: ctx.businessOnly ? 'Zakład Ubezpieczeń Społecznych (wniosek ZAM przez eZUS)' : 'Pracodawca — dział kadr',
        heading: ctx.businessOnly
          ? ['WNIOSEK', `o wypłatę zasiłku macierzyńskiego w wysokości ${averaged ? '81,5%' : '100%'}`]
          : [
              'WNIOSEK',
              averaged ? 'o udzielenie urlopu macierzyńskiego i urlopu rodzicielskiego' : 'o udzielenie urlopu macierzyńskiego',
              `oraz wypłatę zasiłku macierzyńskiego w wysokości ${averaged ? '81,5%' : '100%'}`,
            ],
        paragraphs,
        attachments,
      },
    };
  },
};
