import { ARTICLES } from '@/data/knowledge/articles';
import { formatDate } from '@/domain/dates/formatDate';
import { checkStep } from '@/domain/wizards/checkStep';
import { createWizardContext } from '@/domain/wizards/createWizardContext';
import { describeAnswer } from '@/domain/wizards/describeAnswer';
import { prefillAnswers } from '@/domain/wizards/prefillAnswers';
import type { WizardAnswers, WizardDefinition } from '@/domain/wizards/Wizard';
import { day } from '@/testing/dates';
import { makeProfile } from '@/testing/profiles';

import { findWizard, WIZARDS } from '.';

const today = day(2026, 11, 23); // poniedziałek
const ctx = createWizardContext(makeProfile({ eventDate: '2026-11-10', childName: 'Staś' }), today);

const wizard = (id: string) => findWizard(id) as WizardDefinition;
const check = (id: string, stepId: string, answers: WizardAnswers) => {
  const step = wizard(id).steps(ctx).find((s) => s.id === stepId)!;
  return checkStep(step, answers, ctx);
};

describe('kreatory wniosków', () => {
  it('9 kreatorów z prototypu + szkic macierzyńskiego w ciąży, unikalne id', () => {
    expect(WIZARDS).toHaveLength(10);
    expect(new Set(WIZARDS.map((w) => w.id)).size).toBe(10);
  });

  it('każdy kreator da się przejść na wartościach startowych z profilu + wyborach i zbudować wynik', () => {
    for (const w of WIZARDS) {
      const steps = w.steps(ctx);
      const answers: Record<string, string> = { ...prefillAnswers(steps, ctx) };
      for (const step of steps) {
        if (step.kind === 'choice' && !answers[step.id]) answers[step.id] = step.options[0].value;
        if (step.kind === 'date' && !answers[step.id]) answers[step.id] = formatDate(today);
      }
      expect(w.build(answers, ctx).title).not.toBe('');
    }
  });

  it('wybór jest obowiązkowy', () => {
    expect(check('w-ojcowski', 'parts', {})).toMatchObject({ level: 'error', text: /Wybierz jedną/ });
  });

  describe('szkic wniosku o zasiłek macierzyński (w ciąży)', () => {
    const pregnant = createWizardContext(makeProfile({ stage: 'ciaza', eventDate: '2027-02-15' }), today);
    const draft = wizard('w-macierzynski-szkic');
    const checkDraft = (stepId: string, answers: WizardAnswers) =>
      checkStep(draft.steps(pregnant).find((s) => s.id === stepId)!, answers, pregnant);

    it('jest szkicem; termin porodu podpowiada się z profilu', () => {
      expect(draft.draft).toBe(true);
      expect(prefillAnswers(draft.steps(pregnant), pregnant)).toMatchObject({ due: '15.02.2027', weeksBefore: '0' });
    });

    it('najwcześniej 6 tygodni przed terminem; termin z przeszłości tylko ostrzega', () => {
      expect(checkDraft('weeksBefore', { weeksBefore: '6' })).toBeNull();
      expect(checkDraft('weeksBefore', { weeksBefore: '7' })).toMatchObject({ level: 'error', text: /najwyżej 6 tygodni/ });
      expect(checkDraft('due', { due: '01.11.2026' })).toMatchObject({ level: 'warning' });
    });

    it('pismo do kadr: start 2 tyg. przed terminem, 81,5% za macierzyński + rodzicielski, notka o 21 dniach', () => {
      const result = draft.build({ due: '15.02.2027', weeksBefore: '2', count: '1', variant: '815' }, pregnant);
      if (result.kind !== 'letter') throw new Error('oczekiwano pisma');
      expect(result.letter.to).toBe('Pracodawca — dział kadr');
      expect(result.letter.paragraphs[0]).toMatch(/20 tygodni od dnia 01\.02\.2027, tj\. 2 tyg\. przed .*15\.02\.2027/);
      expect(result.letter.paragraphs[1]).toMatch(/32 tygodni .* 81,5%/);
      expect(result.letter.attachments[0]).toMatch(/przewidywanej dacie porodu/);
      expect(result.note).toMatch(/21 dni po porodzie/);
    });

    it('sama firma: bez „urlopu” z Kodeksu pracy — wniosek ZAM przez eZUS', () => {
      const business = createWizardContext(makeProfile({ stage: 'ciaza', eventDate: '2027-02-15', employment: ['jdg'] }), today);
      const result = draft.build({ due: '15.02.2027', weeksBefore: '0', count: '1', variant: '100' }, business);
      if (result.kind !== 'letter') throw new Error('oczekiwano pisma');
      expect(result.letter.to).toMatch(/ZAM/);
      expect(result.letter.paragraphs.join(' ')).not.toMatch(/Kodeksu pracy/);
      expect(result.letter.paragraphs[0]).toMatch(/od dnia porodu .* 100%/);
    });
  });

  describe('81,5% — 21 dni od porodu', () => {
    it('w terminie — bez uwag; po 21 dniach — blokada z wyjaśnieniem', () => {
      expect(check('w-81', 'birth', { birth: '10.11.2026' })).toBeNull();
      expect(check('w-81', 'birth', { birth: '01.11.2026' })).toMatchObject({ level: 'error', text: /minęło 22 dni/ });
      expect(check('w-81', 'birth', { birth: '01.12.2026' })?.text).toMatch(/w przyszłości/);
    });

    it('pismo: 20 tyg. macierzyńskiego + 32 tyg. rodzicielskiego od dnia porodu (52 tyg. = 364 dni)', () => {
      const result = wizard('w-81').build({ birth: '10.11.2026', count: '1', mode: 'full' }, ctx);
      expect(result.kind).toBe('letter');
      if (result.kind === 'letter') expect(result.letter.paragraphs[0]).toMatch(/20 tygodni .* 32 tygodni.* od 10\.11\.2026 do 08\.11\.2027/);
    });

    it('sama firma — wniosek ZAM do ZUS zamiast pisma', () => {
      const business = createWizardContext(makeProfile({ employment: ['jdg'] }), today);
      expect(wizard('w-81').institution(business)).toBe('ZUS');
      expect(wizard('w-81').build({ birth: '10.11.2026', count: '1' }, business)).toMatchObject({ kind: 'submission', form: 'ZAM' });
    });
  });

  it('rodzicielski: 21 dni przed startem, maks. 5 części', () => {
    expect(check('w-rodzicielski', 'start', { start: '10.12.2026' })?.text).toMatch(/Najwcześniejszy możliwy start .* 14\.12\.2026/);
    expect(check('w-rodzicielski', 'start', { start: '15.12.2026' })).toBeNull();
    expect(check('w-rodzicielski', 'part', { part: '6' })?.text).toMatch(/najwyżej na 5 części/);
    expect(check('w-rodzicielski', 'weeks', { weeks: '40' })?.level).toBe('error');
  });

  it('ojcowski: 7 dni przed i przed 1. urodzinami dziecka', () => {
    expect(check('w-ojcowski', 'start', { parts: '1', start: '25.11.2026' })?.text).toMatch(/co najmniej 7 dni/);
    expect(check('w-ojcowski', 'start', { parts: '1', start: '01.12.2026' })).toBeNull();
    expect(check('w-ojcowski', 'start', { parts: '1', start: '01.11.2027' })?.text).toMatch(/12 miesięcy \(10\.11\.2027\)/);
  });

  it('adopcja: po 7 dniach tylko ostrzeżenie, start do 21 dni od przyjęcia, zawodowa rodzina — nie', () => {
    expect(check('w-adopcja', 'taken', { taken: '01.11.2026' })).toMatchObject({ level: 'warning' });
    expect(check('w-adopcja', 'start', { taken: '01.11.2026', start: '23.11.2026' })?.text).toMatch(/22\.11\.2026/);
    expect(check('w-adopcja', 'type', { type: 'zaw' })?.level).toBe('error');
  });

  it('pogrzebowy: do 12 miesięcy od pochówku; kwota z parametrów prawnych', () => {
    expect(check('w-pogrzebowy', 'date', { date: '01.10.2025' })?.text).toMatch(/ponad 12 miesięcy/);
    expect(wizard('w-pogrzebowy').build({}, ctx)).toMatchObject({ kind: 'submission', form: 'Z-12', summary: /7 000/ });
  });

  it('uzupełniający: liczy tygodnie z silnika kalkulatora i dokłada regułę jako uwagę', () => {
    const result = wizard('w-uzupelniajacy').build({ tc: '32', waga: '1800', dni: '21', end: '29.03.2027' }, ctx);
    expect(result).toMatchObject({ kind: 'letter', title: /\(3 tyg\.\)/, note: /28\. a 37\. tygodniem/ });
  });

  it('przejęcie przez tatę: dopiero po 8 tygodniach od porodu', () => {
    expect(check('w-przejecie', 'since', { since: '01.12.2026' })?.text).toMatch(/05\.01\.2027/);
  });

  it('podsumowanie: etykieta wyboru, liczba z jednostką, brak odpowiedzi', () => {
    const [parts] = wizard('w-ojcowski').steps(ctx);
    expect(describeAnswer(parts, { parts: '2' })).toBe('W dwóch częściach po 7 dni');
    const weeks = wizard('w-rodzicielski').steps(ctx).find((s) => s.id === 'weeks')!;
    expect(describeAnswer(weeks, { weeks: '8' })).toBe('8 tyg.');
    expect(describeAnswer(weeks, {})).toBe('—');
  });

  it('dane do pisma z profilu: imię i dziecko', () => {
    const result = wizard('w-ojcowski').build({ parts: '1', start: '01.12.2026' }, ctx);
    expect(ctx.applicantName).toBe('Jan Przykładowa');
    if (result.kind === 'letter') expect(result.letter.paragraphs[0]).toMatch(/Staś \(data urodzenia: 10\.11\.2026\)/);
  });
});

describe('kreatory a reszta aplikacji', () => {
  it('artykuły Wiedzy wskazują istniejące kreatory', () => {
    for (const article of ARTICLES) {
      if (article.wizard) expect(findWizard(article.wizard)).not.toBeNull();
    }
  });
});
