import { addDays, diffDays } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';
import type { WizardDefinition } from '@/domain/wizards/Wizard';
import { answerDate, error } from '@/domain/wizards/wizardAnswers';

/** w-przejecie: tata przejmuje część macierzyńskiego, gdy mama jest w szpitalu (po 8 tygodniach od porodu). */
export const maternityTakeoverWizard: WizardDefinition = {
  id: 'w-przejecie',
  title: 'Wniosek taty o część urlopu macierzyńskiego (mama w szpitalu)',
  short: 'Po 8 tygodniach od porodu',
  intro:
    'Mama może przerwać urlop macierzyński na czas pobytu w szpitalu, gdy wykorzysta co najmniej 8 tygodni po porodzie. Tata wykorzystuje wtedy tę część urlopu.',
  institution: () => 'PRAC',
  steps: (ctx) => [
    {
      id: 'since',
      kind: 'date',
      question: 'Od kiedy mama jest w szpitalu?',
      prefill: () => formatDate(ctx.today),
      validate: (a) => {
        const since = answerDate(a, 'since');
        if (!since) return error('Podaj datę przyjęcia do szpitala.');
        if (ctx.childBirth && diffDays(ctx.childBirth, since) < 56) {
          return error(
            `Przed upływem 8 tygodni od porodu (${formatDate(addDays(ctx.childBirth, 56))}) mama nie może przerwać urlopu. W tym czasie tacie może przysługiwać zasiłek opiekuńczy (Z-15A).`,
          );
        }
        return null;
      },
    },
    {
      id: 'cert',
      kind: 'document',
      question: 'Dołącz zaświadczenie ze szpitala',
      hint: 'Potwierdzające pobyt i to, że stan zdrowia uniemożliwia mamie opiekę nad dzieckiem.',
    },
  ],
  build: (a, ctx) => ({
    kind: 'letter',
    title: 'Wniosek taty o część urlopu macierzyńskiego',
    letter: {
      to: 'Pracodawca — dział kadr',
      heading: ['WNIOSEK', 'o udzielenie części urlopu macierzyńskiego'],
      paragraphs: [
        `Na podstawie art. 180 § 10–11 i § 16 Kodeksu pracy wnoszę o udzielenie mi części urlopu macierzyńskiego od ${formatDate(answerDate(a, 'since') ?? ctx.today)} na okres pobytu matki dziecka w szpitalu, w związku z przerwaniem przez nią urlopu macierzyńskiego po wykorzystaniu co najmniej 8 tygodni po porodzie.`,
      ],
      attachments: [
        'Zaświadczenie szpitala o pobycie matki dziecka i braku możliwości sprawowania osobistej opieki',
        'Wniosek matki o przerwanie urlopu macierzyńskiego',
      ],
    },
  }),
};
