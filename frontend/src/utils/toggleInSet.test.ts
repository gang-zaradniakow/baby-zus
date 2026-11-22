import { toggleInSet } from './toggleInSet';

describe('toggleInSet', () => {
  it('dodaje brakujący element', () => {
    expect([...toggleInSet(new Set(['a']), 'b')]).toEqual(['a', 'b']);
  });

  it('usuwa istniejący element', () => {
    expect([...toggleInSet(new Set(['a', 'b']), 'a')]).toEqual(['b']);
  });

  it('zwraca nowy zbiór i nie modyfikuje wejścia', () => {
    const input = new Set(['a']);
    const output = toggleInSet(input, 'b');
    expect(output).not.toBe(input);
    expect([...input]).toEqual(['a']);
  });
});
