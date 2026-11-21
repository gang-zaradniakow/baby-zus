import { act, renderHook } from '@testing-library/react-native';

import { addDays, addWeeks, today, toISODate } from '@/domain/dates/calendarDate';
import { formatDate } from '@/domain/dates/formatDate';

import { useOnboardingForm } from './useOnboardingForm';

/** `useToday` bierze prawdziwą dzisiejszą datę, więc daty w testach liczymy względem niej. */
const dueDate = addWeeks(today(), 20);
const birthDate = addDays(today(), -10);

async function renderForm() {
  const onComplete = jest.fn();
  const hook = await renderHook(() => useOnboardingForm(onComplete));
  return { ...hook, onComplete };
}

describe('useOnboardingForm', () => {
  it('startuje od kroku 1 z pustym szkicem — dalej nie można', async () => {
    const { result } = await renderForm();

    expect(result.current.step).toBe(1);
    expect(result.current.draft).toEqual({
      role: 'mama',
      stage: null,
      eventDateText: '',
      childrenCount: 1,
      employment: [],
      partner: 'track',
      special: [],
    });
    expect(result.current.canContinue).toBe(false);
  });

  it('wybór etapu zapisuje go i od razu przechodzi do kroku 2', async () => {
    const { result } = await renderForm();

    await act(() => result.current.selectStage('ciaza'));

    expect(result.current.draft.stage).toBe('ciaza');
    expect(result.current.step).toBe(2);
  });

  describe('krok 2 — data', () => {
    it('niepełna data: bez błędu, ale dalej nie można', async () => {
      const { result } = await renderForm();
      await act(() => result.current.selectStage('ciaza'));

      await act(() => result.current.setEventDateText('12.03'));

      expect(result.current.eventDateError).toBeNull();
      expect(result.current.canContinue).toBe(false);
    });

    it('termin porodu w przeszłości: komunikat błędu i blokada', async () => {
      const { result } = await renderForm();
      await act(() => result.current.selectStage('ciaza'));

      await act(() => result.current.setEventDateText(formatDate(birthDate)));

      expect(result.current.eventDateError).toMatch(/nie może być w przeszłości/);
      expect(result.current.canContinue).toBe(false);
    });

    it('poprawny termin porodu pozwala iść dalej', async () => {
      const { result } = await renderForm();
      await act(() => result.current.selectStage('ciaza'));

      await act(() => result.current.setEventDateText(formatDate(dueDate)));

      expect(result.current.eventDateError).toBeNull();
      expect(result.current.canContinue).toBe(true);
    });
  });

  describe('krok 3 — zatrudnienie', () => {
    it('trzeba wybrać przynajmniej jedną formę', async () => {
      const { result } = await renderForm();
      await act(() => result.current.selectStage('dziecko'));
      await act(() => result.current.setEventDateText(formatDate(birthDate)));
      await act(() => result.current.goNext());

      expect(result.current.step).toBe(3);
      expect(result.current.canContinue).toBe(false);

      await act(() => result.current.toggleEmploymentOption('uop'));
      expect(result.current.canContinue).toBe(true);
    });

    it('„brak ubezpieczenia” wyklucza pozostałe formy', async () => {
      const { result } = await renderForm();

      await act(() => result.current.toggleEmploymentOption('uop'));
      await act(() => result.current.toggleEmploymentOption('jdg'));
      await act(() => result.current.toggleEmploymentOption('brak'));

      expect(result.current.draft.employment).toEqual(['brak']);
    });
  });

  it('krok 4 — sytuacje szczególne są opcjonalne i można je przełączać', async () => {
    const { result } = await renderForm();

    await act(() => result.current.toggleSpecialSituation('preterm'));
    expect(result.current.draft.special).toEqual(['preterm']);

    await act(() => result.current.toggleSpecialSituation('preterm'));
    expect(result.current.draft.special).toEqual([]);
  });

  it('goBack i goNext nie wychodzą poza zakres kroków 1–4', async () => {
    const { result } = await renderForm();

    await act(() => result.current.goBack());
    expect(result.current.step).toBe(1);

    for (let i = 0; i < 5; i += 1) {
      await act(() => result.current.goNext());
    }
    expect(result.current.step).toBe(4);
    expect(result.current.canContinue).toBe(true);
  });

  it('finish przekazuje gotowy profil z datą w formacie ISO', async () => {
    const { result, onComplete } = await renderForm();

    await act(() => result.current.selectStage('dziecko'));
    await act(() => result.current.setEventDateText(formatDate(birthDate)));
    await act(() => result.current.toggleEmploymentOption('jdg'));
    await act(() => result.current.toggleSpecialSituation('abroad'));
    await act(() => result.current.finish());

    expect(onComplete).toHaveBeenCalledWith({
      role: 'mama',
      stage: 'dziecko',
      eventDate: toISODate(birthDate),
      childrenCount: 1,
      employment: ['jdg'],
      partner: 'track',
      special: ['abroad'],
    });
  });

  it('finish bez etapu lub poprawnej daty nic nie robi', async () => {
    const { result, onComplete } = await renderForm();

    await act(() => result.current.finish());
    await act(() => result.current.selectStage('ciaza'));
    await act(() => result.current.setEventDateText('31.02.2027'));
    await act(() => result.current.finish());

    expect(onComplete).not.toHaveBeenCalled();
  });
});
