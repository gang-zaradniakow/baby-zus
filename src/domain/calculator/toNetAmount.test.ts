import { toNetAmount } from './toNetAmount';

describe('toNetAmount', () => {
  it('odejmuje zaokrągloną zaliczkę PIT 12%', () => {
    expect(toNetAmount(5000)).toBe(4400);
    expect(toNetAmount(4147.1)).toBeCloseTo(3649.1, 1);
  });
});
