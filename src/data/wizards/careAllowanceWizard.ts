import { addDays } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { answerDate, answerNumber, error } from '@/domain/wizards/wizardAnswers';

const REASONS: Record<string, string> = {
  sick: 'opieki nad chorym dzieckiem',
  closed: 'nieprzewidzianego zamknięcia placówki',
  nanny: 'choroby niani/dziennego opiekuna',
  parent: 'porodu/choroby/pobytu w szpitalu drugiego rodzica',
};

/** w-opiekunczy: zasiłek opiekuńczy Z-15A — 80%, do 60 dni w roku. */
export const careAllowanceWizard: WizardDefinition = {
  id: 'w-opiekunczy',
  title: 'Wniosek o zasiłek opiekuńczy (Z-15A)',
  short: '80%, do 60 dni w roku',
  intro: 'Zasiłek nie jest wypłacany automatycznie po wystawieniu zwolnienia — potrzebny jest ten wniosek.',
  institution: (ctx) => (ctx.businessOnly ? 'ZUS' : 'PRAC'),
  steps: (ctx) => [
    {
      id: 'why',
      kind: 'choice',
      question: 'Dlaczego opiekujesz się dzieckiem?',
      options: [
        { value: 'sick', label: 'Dziecko jest chore (do 14 lat)', hint: 'Potrzebne e-ZLA na opiekę.' },
        { value: 'closed', label: 'Nieprzewidziane zamknięcie żłobka/przedszkola (do 8 lat)', hint: 'Zawiadomienie krócej niż 7 dni przed.' },
        { value: 'nanny', label: 'Choroba niani lub dziennego opiekuna (do 8 lat)' },
        { value: 'parent', label: 'Poród, choroba lub szpital drugiego rodzica, który stale opiekuje się dzieckiem' },
      ],
    },
    {
      id: 'from',
      kind: 'date',
      question: 'Od kiedy?',
      prefill: () => formatDate(ctx.today),
      validate: (a) => (answerDate(a, 'from') ? null : error('Podaj datę rozpoczęcia opieki.')),
    },
    {
      id: 'days',
      kind: 'number',
      question: 'Ile dni?',
      min: 1,
      max: 60,
      unit: 'dni',
      prefill: () => '3',
      validate: (a) => {
        const days = answerNumber(a, 'days');
        if (!days || days < 1) return error('Wpisz liczbę dni (co najmniej 1).');
        return days > 60 ? error('W roku łącznie przysługuje maksymalnie 60 dni na dzieci do 14 lat.') : null;
      },
    },
  ],
  build: (a, ctx) => {
    const from = answerDate(a, 'from') ?? ctx.today;
    const days = answerNumber(a, 'days') ?? 1;
    const to = addDays(from, days - 1);
    const period = `${formatDate(from)} – ${formatDate(to)} (${days} dni)`;
    const reason = REASONS[a.why] ?? REASONS.sick;
    if (ctx.businessOnly) {
      return {
        kind: 'submission',
        title: 'Wniosek o zasiłek opiekuńczy',
        form: 'Z-15A',
        destination: 'eZUS',
        summary: `Okres: ${period}, z powodu ${reason}.`,
      };
    }
    return {
      kind: 'letter',
      title: 'Wniosek o zasiłek opiekuńczy (Z-15A)',
      letter: {
        to: 'Pracodawca — dział kadr',
        heading: ['WNIOSEK', 'o zasiłek opiekuńczy (Z-15A)'],
        paragraphs: [
          `Wnoszę o wypłatę zasiłku opiekuńczego za okres od ${formatDate(from)} do ${formatDate(to)} (${days} dni) z powodu ${reason}: ${ctx.childName}.`,
          'Oświadczam, że w tym okresie nie ma innego członka rodziny, który mógłby zapewnić opiekę.',
        ],
        attachments: [],
      },
    };
  },
};
