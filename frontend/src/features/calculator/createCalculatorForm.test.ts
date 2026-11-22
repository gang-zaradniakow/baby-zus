import { day } from '@/testing/dates';
import { makeProfile } from '@/testing/profiles';

import { createCalculatorForm } from './createCalculatorForm';

const today = day(2026, 11, 21);

describe('createCalculatorForm', () => {
  it('bez profilu — mama na etacie, tata na etacie, dzisiejsza data', () => {
    const form = createCalculatorForm(null, today);

    expect(form).toMatchObject({ situation: 'birth', dateText: '21.11.2026', childrenCount: 1, variant: 'standard' });
    expect(form.mother.titles.uop.on).toBe(true);
    expect(form.father.titles.uop.on).toBe(true);
    expect(form.fatherPlan).toEqual({ paternity: true, parentalWeeks: 9, maternityTakeover: 0 });
  });

  it('mama z firmą: jej praca trafia do mamy, data i liczba dzieci z ankiety', () => {
    const form = createCalculatorForm(
      makeProfile({ employment: ['jdg'], eventDate: '2026-11-01', childrenCount: 2, special: ['zazyciem', 'preterm'] }),
      today,
    );

    expect(form.mother.titles.jdg.on).toBe(true);
    expect(form.mother.titles.uop.on).toBe(false);
    expect(form).toMatchObject({ dateText: '01.11.2026', childrenCount: 2, zaZyciem: true });
    expect(form.preterm.on).toBe(true);
  });

  it('tata wypełnia ankietę — jego praca to praca taty', () => {
    const form = createCalculatorForm(makeProfile({ role: 'tata', employment: ['zlec'] }), today);
    expect(form.father.titles.zlec.on).toBe(true);
    expect(form.mother.titles.uop.on).toBe(true);
  });

  it('samodzielne wychowywanie — drugi rodzic bez pracy i bez urlopów', () => {
    const form = createCalculatorForm(makeProfile({ partner: 'single' }), today);
    expect(form.father.titles.uop.on).toBe(false);
    expect(form.fatherPlan).toEqual({ paternity: false, parentalWeeks: 0, maternityTakeover: 0 });
  });

  it('adopcja — sytuacja „adoption” i wiek dziecka w dniu przyjęcia', () => {
    const form = createCalculatorForm(
      makeProfile({ stage: 'adopcja', eventDate: '2026-10-01', childBirthDate: '2022-10-01' }),
      today,
    );
    expect(form.situation).toBe('adoption');
    expect(form.adoption.childAgeYears).toBe(4);
  });

  it('przycisk „Policz” w artykule może wymusić sytuację', () => {
    expect(createCalculatorForm(null, today, 'pregnancy').situation).toBe('pregnancy');
  });
});
