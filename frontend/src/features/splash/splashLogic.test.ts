import { advanceProgress, WAITING_CAP } from './loadingProgress';
import { pickFact } from './pickFact';
import { resolveLoadingStatus } from './resolveLoadingStatus';

describe('advanceProgress', () => {
  it('bez gotowości danych zatrzymuje się na progu oczekiwania', () => {
    expect(advanceProgress(0.88, false)).toBe(WAITING_CAP);
    expect(advanceProgress(WAITING_CAP, false)).toBe(WAITING_CAP);
  });

  it('po gotowości dochodzi do 1 i nie przekracza', () => {
    expect(advanceProgress(WAITING_CAP, true)).toBeCloseTo(0.94);
    expect(advanceProgress(0.99, true)).toBe(1);
  });
});

describe('resolveLoadingStatus', () => {
  it('napis zmienia się wraz z postępem', () => {
    expect(resolveLoadingStatus(0)).toBe('Ładuję wiedzę z poradnika…');
    expect(resolveLoadingStatus(0.6)).toBe('Łączę się…');
    expect(resolveLoadingStatus(1)).toBe('Gotowe!');
  });
});

describe('pickFact', () => {
  const facts = ['a', 'b', 'c'];

  it('wybiera według wylosowanej liczby', () => {
    expect(pickFact(facts, 0)).toBe('a');
    expect(pickFact(facts, 0.5)).toBe('b');
    expect(pickFact(facts, 0.9999)).toBe('c');
  });

  it('pusta lista → pusty napis', () => {
    expect(pickFact([], 0.3)).toBe('');
  });
});
