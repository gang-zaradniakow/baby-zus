import { maternityLeaveWeeks } from '@/domain/calculator/maternityLeaveWeeks';
import { parentalLeaveWeeks } from '@/domain/calculator/parentalLeaveWeeks';
import { addDays, addWeeks, diffDays } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { answerDate, error } from '@/domain/wizards/wizardAnswers';

/** w-81: wniosek o pełny wymiar urlopu i zasiłek 81,5% — do 21 dni po porodzie. */
export const averagedBenefitWizard: WizardDefinition = {
  id: 'w-81',
  title: 'Zasiłek 81,5% — wniosek o pełny wymiar urlopu',
  short: 'Wariant uśredniony: 81,5% przez cały rok',
  intro: 'Masz na to 21 dni po porodzie. Odpowiesz na 4 krótkie pytania.',
  institution: (ctx) => (ctx.businessOnly ? 'ZUS' : 'PRAC'),
  steps: (ctx) => [
    {
      id: 'birth',
      kind: 'date',
      question: 'Kiedy urodziło się dziecko?',
      prefill: () => (ctx.childBirth ? formatDate(ctx.childBirth) : ''),
      validate: (a) => {
        const birth = answerDate(a, 'birth');
        if (!birth) return error('Wygląda na to, że pominęliśmy datę porodu. Uzupełnij ją, byśmy mogli przygotować wniosek.');
        const days = diffDays(birth, ctx.today);
        if (days < 0) return error('Ta data jest w przyszłości. Wniosek złożysz po porodzie — przypomnimy Ci o tym.');
        if (days > 21) {
          return error(
            `Od porodu minęło ${days} dni, a na wariant 81,5% jest 21 dni. Dostaniesz 100% za macierzyński i 70% za rodzicielski — to też dobry wariant.`,
          );
        }
        return null;
      },
    },
    {
      id: 'count',
      kind: 'choice',
      question: 'Ile dzieci urodziło się przy tym porodzie?',
      prefill: () => String(ctx.childrenCount),
      options: [
        { value: '1', label: 'Jedno' },
        { value: '2', label: 'Dwoje' },
        { value: '3', label: 'Troje' },
        { value: '4', label: 'Czworo' },
        { value: '5', label: 'Pięcioro lub więcej' },
      ],
    },
    {
      id: 'mode',
      kind: 'choice',
      question: 'Jak chcesz zaplanować urlop rodzicielski?',
      options: [
        { value: 'full', label: 'Od razu cały — macierzyński + moja część rodzicielskiego', hint: 'Najprostsze. Później możesz zrezygnować z części.' },
        { value: 'decl', label: 'Deklaracja: będę korzystać w pełnym wymiarze, terminy podam później', hint: 'Też daje 81,5%.' },
      ],
    },
    {
      id: 'dad',
      kind: 'choice',
      question: 'Czy drugi rodzic planuje wykorzystać swoje 9 tygodni?',
      hint: 'To nie wpływa na Twój wniosek.',
      options: [
        { value: 'yes', label: 'Tak' },
        { value: 'no', label: 'Nie / jeszcze nie wiemy' },
        { value: 'na', label: 'Nie dotyczy' },
      ],
    },
  ],
  build: (a, ctx) => {
    const count = Number(a.count) || 1;
    const maternity = maternityLeaveWeeks(count, ctx.params);
    const parental = parentalLeaveWeeks(count, false, ctx.params) - ctx.params.nonTransferableWeeks;
    const birth = answerDate(a, 'birth') ?? ctx.today;
    const end = addDays(addWeeks(birth, maternity + parental), -1);
    const period = `od ${formatDate(birth)} do ${formatDate(end)}`;

    if (ctx.businessOnly) {
      return {
        kind: 'submission',
        title: 'Wniosek o zasiłek macierzyński (wariant 81,5%)',
        form: 'ZAM',
        destination: 'eZUS',
        summary: `Zasiłek za ${maternity} tyg. macierzyńskiego i ${parental} tyg. rodzicielskiego w wysokości 81,5% podstawy, ${period}.`,
      };
    }
    return {
      kind: 'letter',
      title: 'Wniosek o urlop macierzyński i rodzicielski w pełnym wymiarze (81,5%)',
      letter: {
        to: 'Pracodawca — dział kadr',
        heading: [
          'WNIOSEK',
          'o udzielenie urlopu macierzyńskiego i urlopu rodzicielskiego',
          'oraz wypłatę zasiłku macierzyńskiego w wysokości 81,5%',
        ],
        paragraphs: [
          `Na podstawie art. 180 i art. 182¹ᵃ Kodeksu pracy oraz art. 30a ust. 1 ustawy o świadczeniach pieniężnych z ubezpieczenia społecznego w razie choroby i macierzyństwa ${a.mode === 'decl' ? 'oświadczam, że zamierzam korzystać z' : 'wnoszę o udzielenie'} urlopu macierzyńskiego w wymiarze ${maternity} tygodni oraz urlopu rodzicielskiego w wymiarze ${parental} tygodni, bezpośrednio po urlopie macierzyńskim, tj. w okresie ${period}.`,
          'Wnoszę o wypłatę zasiłku macierzyńskiego za cały ten okres w wysokości 81,5% podstawy wymiaru. Wniosek nie obejmuje części urlopu rodzicielskiego przysługującej wyłącznie drugiemu rodzicowi (9 tygodni).',
        ],
        attachments: ['Skrócony odpis aktu urodzenia dziecka (do wglądu) albo wniosek o pobranie go przez ZUS z rejestru USC'],
      },
    };
  },
};
