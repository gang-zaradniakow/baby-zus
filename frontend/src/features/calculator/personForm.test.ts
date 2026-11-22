import { createPersonForm, hasNoTitles, patchTitle, patchZ3Month, toggleTitle } from './personForm';

describe('personForm', () => {
  it('włącza tytuły z ankiety, z domyślnymi podstawami po odjęciu 13,71%', () => {
    const person = createPersonForm(['uop', 'jdg']);

    expect(person.titles.uop).toMatchObject({ on: true, base: 5177.4 });
    expect(person.titles.zlec).toMatchObject({ on: false, base: 3883.05 });
    expect(person.titles.jdg).toMatchObject({ on: true, base: 4877.11 });
    expect(person.months).toHaveLength(12);
  });

  it('toggleTitle przełącza tytuł, „Nie pracuje” wyłącza wszystkie', () => {
    const person = toggleTitle(createPersonForm(['uop']), 'zlec');
    expect(person.titles.zlec.on).toBe(true);

    const none = toggleTitle(person, 'none');
    expect(hasNoTitles(none)).toBe(true);
    expect(none.titles.uop.base).toBe(person.titles.uop.base); // podstawy zostają na później
  });

  it('patchTitle i patchZ3Month zmieniają tylko wskazane pole', () => {
    const person = patchTitle(createPersonForm(['uop']), 'uop', { base: 7000 });
    expect(person.titles.uop).toMatchObject({ on: true, base: 7000, atLeastMinWage: true });

    const withMonth = patchZ3Month(person, 2, { amount: 6000 });
    expect(withMonth.months[2]).toEqual({ amount: 6000, skip: false });
    expect(withMonth.months[1].amount).toBe(0);
  });
});
