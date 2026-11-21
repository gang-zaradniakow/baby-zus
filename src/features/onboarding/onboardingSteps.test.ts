import { EMPTY_DRAFT } from './onboardingDraft';
import { getVisibleSteps, isAutoAdvanceStep } from './onboardingSteps';

describe('getVisibleSteps', () => {
  it('kroki idą w kolejności z prototypu', () => {
    expect(getVisibleSteps(EMPTY_DRAFT)).toEqual(['role', 'stage', 'date', 'count', 'special', 'employment']);
  });
});

describe('isAutoAdvanceStep', () => {
  it('kroki jednokrotnego wyboru przechodzą dalej same, pozostałe mają „Dalej”', () => {
    expect(isAutoAdvanceStep('role')).toBe(true);
    expect(isAutoAdvanceStep('stage')).toBe(true);
    expect(isAutoAdvanceStep('count')).toBe(true);
    expect(isAutoAdvanceStep('date')).toBe(false);
    expect(isAutoAdvanceStep('special')).toBe(false);
    expect(isAutoAdvanceStep('employment')).toBe(false);
  });
});
