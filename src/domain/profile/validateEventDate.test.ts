import { toISODate } from '@/domain/dates/calendarDate';
import { day } from '@/testing/dates';

import { validateEventDate } from './validateEventDate';

const today = day(2026, 11, 21);

describe('validateEventDate', () => {
  it('niepełny tekst nie jest ani poprawny, ani błędny (użytkownik jeszcze pisze)', () => {
    expect(validateEventDate('ciaza', '15.03', today)).toEqual({ date: null, error: null });
  });

  it('nieistniejąca data daje komunikat', () => {
    const result = validateEventDate('dziecko', '31.02.2026', today);
    expect(result.date).toBeNull();
    expect(result.error).toMatch(/nie istnieje/);
  });

  describe('ciąża', () => {
    it('przyjmuje termin w ciągu 42 tygodni', () => {
      const result = validateEventDate('ciaza', '15.03.2027', today);
      expect(result.error).toBeNull();
      expect(toISODate(result.date!)).toBe('2027-03-15');
    });

    it('przyjmuje termin na dziś', () => {
      expect(validateEventDate('ciaza', '21.11.2026', today).date).not.toBeNull();
    });

    it('odrzuca termin w przeszłości', () => {
      expect(validateEventDate('ciaza', '20.11.2026', today).error).toMatch(/w przeszłości/);
    });

    it('odrzuca termin dalszy niż 42 tygodnie', () => {
      expect(validateEventDate('ciaza', '01.12.2027', today).error).toMatch(/42 tygodni/);
    });
  });

  describe.each(['dziecko', 'adopcja'] as const)('%s', (stage) => {
    it('przyjmuje datę z przeszłości', () => {
      expect(validateEventDate(stage, '01.11.2026', today).date).not.toBeNull();
    });

    it('odrzuca datę z przyszłości', () => {
      expect(validateEventDate(stage, '22.11.2026', today).error).toBe('Ta data nie może być z przyszłości.');
    });

    it('odrzuca datę starszą niż 3 lata', () => {
      expect(validateEventDate(stage, '20.11.2023', today).error).toMatch(/3\. urodzin/);
    });
  });
});
