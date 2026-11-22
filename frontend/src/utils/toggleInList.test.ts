import { toggleInList } from './toggleInList';

describe('toggleInList', () => {
  it('dodaje element, którego nie ma na liście', () => {
    expect(toggleInList(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('usuwa element, który już jest na liście', () => {
    expect(toggleInList(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('nie modyfikuje listy wejściowej', () => {
    const input = ['a'];
    toggleInList(input, 'b');
    expect(input).toEqual(['a']);
  });
});
