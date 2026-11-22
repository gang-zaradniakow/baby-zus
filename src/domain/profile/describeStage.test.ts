import { day } from '@/testing/dates';
import { makeProfile } from '@/testing/profiles';

import { describeStage } from './describeStage';
import type { ParentProfile } from './ParentProfile';

const today = day(2026, 11, 21);
const profile = (stage: ParentProfile['stage'], eventDate: string): ParentProfile =>
  makeProfile({ stage, eventDate });

describe('describeStage', () => {
  it('planowanie: orientacyjny termin', () => {
    expect(describeStage(profile('planuje', '2027-09-01'), today)).toBe('Planujecie dziecko · orientacyjnie 01.09.2027');
  });

  it('ciąża: tydzień i termin', () => {
    expect(describeStage(profile('ciaza', '2027-03-13'), today)).toBe('Ciąża · 24. tydzień · termin 13.03.2027');
  });

  it('dziecko: wiek', () => {
    expect(describeStage(profile('dziecko', '2026-11-01'), today)).toBe('Dziecko · 2 tyg. 6 dni');
  });

  it('adopcja: data przyjęcia', () => {
    expect(describeStage(profile('adopcja', '2026-10-05'), today)).toBe('Przyjęcie dziecka · 05.10.2026');
  });
});
