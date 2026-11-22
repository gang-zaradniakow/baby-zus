import { isTimelineInstitution } from './isTimelineInstitution';

describe('isTimelineInstitution', () => {
  it('przepuszcza pracodawcę i ZUS', () => {
    expect(isTimelineInstitution('PRAC')).toBe(true);
    expect(isTimelineInstitution('ZUS')).toBe(true);
  });

  it('odrzuca pozostałe instytucje i informacje', () => {
    for (const other of ['NFZ', 'USC', 'GMINA', 'INFO'] as const) {
      expect(isTimelineInstitution(other)).toBe(false);
    }
  });
});
