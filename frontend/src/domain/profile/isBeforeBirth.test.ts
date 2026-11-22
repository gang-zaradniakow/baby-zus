import { isBeforeBirth } from './isBeforeBirth';

describe('isBeforeBirth', () => {
  it('planowanie i ciąża — przed porodem; dziecko i adopcja — nie', () => {
    expect(isBeforeBirth('planuje')).toBe(true);
    expect(isBeforeBirth('ciaza')).toBe(true);
    expect(isBeforeBirth('dziecko')).toBe(false);
    expect(isBeforeBirth('adopcja')).toBe(false);
  });
});
