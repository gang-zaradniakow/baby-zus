import { formatDate } from '@/domain/dates/formatDate';
import type { WizardDefinition } from '@/domain/wizards/Wizard';

const KINDS: Record<string, string> = { skr: 'odpis skrócony', zup: 'odpis zupełny', wiel: 'odpis wielojęzyczny' };
const DELIVERY: Record<string, string> = {
  elek: 'elektronicznie na skrzynkę gov.pl',
  usc: 'osobiście w USC',
  poczta: 'pocztą',
};

/** w-odpis: wniosek o odpis aktu urodzenia (gov.pl — USC), symulacja. */
export const birthCertificateWizard: WizardDefinition = {
  id: 'w-odpis',
  title: 'Wniosek o odpis aktu urodzenia',
  short: 'Rejestr stanu cywilnego (gov.pl) — symulacja',
  intro: 'Do zasiłku zwykle nie musisz dostarczać odpisu — ZUS może pobrać go sam. Odpis przyda się np. w innych urzędach.',
  institution: () => 'USC',
  steps: () => [
    {
      id: 'rodzaj',
      kind: 'choice',
      question: 'Jaki odpis potrzebujesz?',
      options: [
        { value: 'skr', label: 'Odpis skrócony', hint: 'Najczęściej wystarcza' },
        { value: 'zup', label: 'Odpis zupełny', hint: 'Pełna treść aktu z adnotacjami' },
        { value: 'wiel', label: 'Odpis wielojęzyczny', hint: 'Do użytku za granicą' },
      ],
    },
    {
      id: 'osoba',
      kind: 'info',
      question: 'Czyj to akt?',
      text: (ctx) =>
        `${ctx.childName}${ctx.childBirth ? ` — ur. ${formatDate(ctx.childBirth)}` : ''} (dane z rejestru PESEL — zaślepka)`,
    },
    {
      id: 'odbior',
      kind: 'choice',
      question: 'Jak chcesz odebrać odpis?',
      options: [
        { value: 'elek', label: 'Elektronicznie — na skrzynkę w gov.pl' },
        { value: 'usc', label: 'Osobiście w wybranym USC' },
        { value: 'poczta', label: 'Pocztą na adres zamieszkania' },
      ],
    },
  ],
  build: (a, ctx) => ({
    kind: 'submission',
    title: `Wniosek o ${KINDS[a.rodzaj] ?? KINDS.skr} aktu urodzenia`,
    form: 'wniosek o odpis aktu stanu cywilnego (gov.pl)',
    destination: 'gov.pl — USC',
    summary: `Wniosek dotyczy aktu urodzenia: ${ctx.childName}. Odbiór: ${DELIVERY[a.odbior] ?? DELIVERY.elek}. Opłata skarbowa według cennika gov.pl (niektóre cele są zwolnione).`,
  }),
};
