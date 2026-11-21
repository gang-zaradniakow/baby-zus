import { act, renderHook } from '@testing-library/react-native';

import { addDays, addWeeks, today, toISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';

import { EMPTY_DRAFT } from './onboardingDraft';
import { useOnboardingForm } from './useOnboardingForm';

/** `useToday` bierze prawdziwą dzisiejszą datę, więc daty w testach liczymy względem niej. */
const dueDate = addWeeks(today(), 20);
const birthDate = addDays(today(), -10);

async function renderForm() {
  const onComplete = jest.fn();
  const hook = await renderHook(() => useOnboardingForm(onComplete));
  return { ...hook, onComplete };
}

type Form = Awaited<ReturnType<typeof renderForm>>['result'];

/** Przechodzi rolę i etap, zostawiając formularz na kroku daty. */
async function goToDate(result: Form, stage: 'ciaza' | 'dziecko' = 'dziecko') {
  await act(() => result.current.selectRole('mama'));
  await act(() => result.current.selectStage(stage));
}

describe('useOnboardingForm', () => {
  it('startuje od kroku „rola” z pustym szkicem — dalej nie można', async () => {
    const { result } = await renderForm();

    expect(result.current.step).toBe('role');
    expect(result.current.stepNumber).toBe(1);
    expect(result.current.totalSteps).toBe(6);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.autoAdvances).toBe(true);
    expect(result.current.draft).toEqual(EMPTY_DRAFT);
    expect(result.current.canContinue).toBe(false);
  });

  it('wybór roli, etapu i liczby dzieci zapisuje odpowiedź i od razu przechodzi dalej', async () => {
    const { result } = await renderForm();

    await act(() => result.current.selectRole('tata'));
    expect(result.current.draft.role).toBe('tata');
    expect(result.current.step).toBe('stage');

    await act(() => result.current.selectStage('ciaza'));
    expect(result.current.draft.stage).toBe('ciaza');
    expect(result.current.step).toBe('date');

    await act(() => result.current.setEventDateText(formatDate(dueDate)));
    await act(() => result.current.goNext());
    expect(result.current.step).toBe('count');

    await act(() => result.current.selectChildrenCount(2));
    expect(result.current.draft.childrenCount).toBe(2);
    expect(result.current.step).toBe('special');
  });

  describe('krok „data”', () => {
    it('niepełna data: bez błędu, ale dalej nie można', async () => {
      const { result } = await renderForm();
      await goToDate(result, 'ciaza');

      await act(() => result.current.setEventDateText('12.03'));

      expect(result.current.autoAdvances).toBe(false);
      expect(result.current.eventDateError).toBeNull();
      expect(result.current.canContinue).toBe(false);
    });

    it('termin porodu w przeszłości: komunikat błędu i blokada', async () => {
      const { result } = await renderForm();
      await goToDate(result, 'ciaza');

      await act(() => result.current.setEventDateText(formatDate(birthDate)));

      expect(result.current.eventDateError).toMatch(/nie może być w przeszłości/);
      expect(result.current.canContinue).toBe(false);
    });

    it('poprawny termin porodu pozwala iść dalej', async () => {
      const { result } = await renderForm();
      await goToDate(result, 'ciaza');

      await act(() => result.current.setEventDateText(formatDate(dueDate)));

      expect(result.current.eventDateError).toBeNull();
      expect(result.current.canContinue).toBe(true);
    });
  });

  describe('krok „zatrudnienie” i „płatnik”', () => {
    /** Przechodzi ankietę aż do kroku zatrudnienia. */
    async function goToEmployment(result: Form) {
      await goToDate(result);
      await act(() => result.current.setEventDateText(formatDate(birthDate)));
      await act(() => result.current.goNext());
      await act(() => result.current.selectChildrenCount(1));
      await act(() => result.current.goNext());
    }

    it('zatrudnienie wymaga przynajmniej jednej formy', async () => {
      const { result } = await renderForm();
      await goToEmployment(result);

      expect(result.current.step).toBe('employment');
      expect(result.current.canContinue).toBe(false);

      await act(() => result.current.toggleEmploymentOption('jdg'));
      expect(result.current.canContinue).toBe(true);
      expect(result.current.isLastStep).toBe(true); // sama firma — bez pytania o płatnika
    });

    it('przy umowie o pracę pojawia się krok „płatnik”, a jego odpowiedź trafia do profilu', async () => {
      const { result, onComplete } = await renderForm();
      await goToEmployment(result);

      await act(() => result.current.toggleEmploymentOption('uop'));
      expect(result.current.isLastStep).toBe(false);
      await act(() => result.current.goNext());

      expect(result.current.step).toBe('payer');
      expect(result.current.canContinue).toBe(false);
      await act(() => result.current.selectPayerSize('maly'));
      await act(() => result.current.finish());

      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ employment: ['uop'], payerSize: 'maly' }));
    });

    it('odpowiedź o płatniku znika z profilu, gdy etat zamieniono na firmę', async () => {
      const { result, onComplete } = await renderForm();
      await goToEmployment(result);
      await act(() => result.current.toggleEmploymentOption('uop'));
      await act(() => result.current.goNext());
      await act(() => result.current.selectPayerSize('duzy'));
      await act(() => result.current.goBack());

      await act(() => result.current.toggleEmploymentOption('uop'));
      await act(() => result.current.toggleEmploymentOption('jdg'));
      await act(() => result.current.finish());

      expect(onComplete).toHaveBeenCalledWith(expect.not.objectContaining({ payerSize: expect.anything() }));
    });

    it('„brak ubezpieczenia” wyklucza pozostałe formy', async () => {
      const { result } = await renderForm();

      await act(() => result.current.toggleEmploymentOption('uop'));
      await act(() => result.current.toggleEmploymentOption('jdg'));
      await act(() => result.current.toggleEmploymentOption('brak'));

      expect(result.current.draft.employment).toEqual(['brak']);
    });
  });

  it('sytuacje szczególne są opcjonalne i można je przełączać', async () => {
    const { result } = await renderForm();

    await act(() => result.current.toggleSpecialSituation('preterm'));
    expect(result.current.draft.special).toEqual(['preterm']);

    await act(() => result.current.toggleSpecialSituation('preterm'));
    expect(result.current.draft.special).toEqual([]);
  });

  it('goBack i goNext nie wychodzą poza listę kroków', async () => {
    const { result } = await renderForm();

    await act(() => result.current.goBack());
    expect(result.current.step).toBe('role');

    for (let i = 0; i < 10; i += 1) {
      await act(() => result.current.goNext());
    }
    expect(result.current.step).toBe('employment');
  });

  it('finish przekazuje gotowy profil z datą w formacie ISO', async () => {
    const { result, onComplete } = await renderForm();

    await act(() => result.current.selectRole('opiekun'));
    await act(() => result.current.selectStage('dziecko'));
    await act(() => result.current.setEventDateText(formatDate(birthDate)));
    await act(() => result.current.selectChildrenCount(3));
    await act(() => result.current.toggleSpecialSituation('abroad'));
    await act(() => result.current.toggleEmploymentOption('jdg'));
    await act(() => result.current.finish());

    expect(onComplete).toHaveBeenCalledWith({
      role: 'opiekun',
      stage: 'dziecko',
      eventDate: toISODate(birthDate),
      childrenCount: 3,
      employment: ['jdg'],
      partner: 'track',
      special: ['abroad'],
    });
  });

  it('finish bez kompletu odpowiedzi nic nie robi', async () => {
    const { result, onComplete } = await renderForm();

    await act(() => result.current.finish());
    await goToDate(result, 'ciaza');
    await act(() => result.current.setEventDateText('31.02.2027'));
    await act(() => result.current.finish());
    await act(() => result.current.setEventDateText(formatDate(dueDate)));
    await act(() => result.current.finish()); // wciąż brak liczby dzieci

    expect(onComplete).not.toHaveBeenCalled();
  });
});
