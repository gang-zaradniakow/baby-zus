import { diffDays } from '@/domain/dates/calendarDate';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { answerDate, error } from '@/domain/wizards/wizardAnswers';
import { formatMoney } from '@/utils/formatMoney';

/** w-pogrzebowy: zasiłek pogrzebowy Z-12 — do ZUS, w ciągu 12 miesięcy od pochówku. */
export const funeralAllowanceWizard: WizardDefinition = {
  id: 'w-pogrzebowy',
  title: 'Wniosek o zasiłek pogrzebowy (Z-12)',
  short: 'Pełna kwota dla rodziców',
  intro: 'Zrobimy to razem, krok po kroku. Możesz przerwać w każdej chwili.',
  institution: () => 'ZUS',
  steps: (ctx) => [
    {
      id: 'who',
      kind: 'choice',
      question: 'Kto pokrył koszty pogrzebu?',
      options: [
        { value: 'me', label: 'Ja' },
        { value: 'partner', label: 'Drugi rodzic' },
        { value: 'other', label: 'Inna osoba' },
      ],
    },
    {
      id: 'date',
      kind: 'date',
      question: 'Kiedy odbył się pochówek?',
      validate: (a) => {
        const date = answerDate(a, 'date');
        if (!date) return error('Podaj datę pochówku — wniosek składa się w ciągu 12 miesięcy od niej.');
        const days = diffDays(date, ctx.today);
        if (days < 0) return error('Ta data jest w przyszłości. Wniosek złożysz po pochówku.');
        if (days > 366) return error('Minęło ponad 12 miesięcy od pochówku. Skontaktuj się z ZUS (mama@zus.pl) — sprawdzimy Twoją sytuację.');
        return null;
      },
    },
    {
      id: 'docs',
      kind: 'document',
      question: 'Dołącz rachunki za pogrzeb',
      hint: `Rodzice dostają pełną kwotę ${formatMoney(ctx.params.funeralAllowance, 0)}, nawet przy niższych kosztach.`,
    },
  ],
  build: (_a, ctx) => ({
    kind: 'submission',
    title: 'Wniosek o zasiłek pogrzebowy',
    form: 'Z-12',
    destination: 'eZUS',
    summary: `Zasiłek pogrzebowy ${formatMoney(ctx.params.funeralAllowance, 0)}. ZUS może poprosić o akt urodzenia z adnotacją albo zaświadczenie o martwym urodzeniu — jeśli tak, przypomnimy Ci o tym delikatnie.`,
  }),
};
