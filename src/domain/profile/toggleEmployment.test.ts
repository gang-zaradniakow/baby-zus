import { toggleEmployment } from './toggleEmployment';

describe('toggleEmployment', () => {
  it('pozwala łączyć formy zatrudnienia (zbieg tytułów)', () => {
    expect(toggleEmployment(['uop'], 'jdg')).toEqual(['uop', 'jdg']);
  });

  it('odznacza zaznaczoną formę', () => {
    expect(toggleEmployment(['uop', 'jdg'], 'uop')).toEqual(['jdg']);
  });

  it('„Brak ubezpieczenia” czyści pozostałe formy', () => {
    expect(toggleEmployment(['uop', 'jdg'], 'brak')).toEqual(['brak']);
  });

  it('wybranie formy pracy usuwa „Brak ubezpieczenia”', () => {
    expect(toggleEmployment(['brak'], 'zlec')).toEqual(['zlec']);
  });

  it('ponowne kliknięcie „Brak ubezpieczenia” go odznacza', () => {
    expect(toggleEmployment(['brak'], 'brak')).toEqual([]);
  });
});
