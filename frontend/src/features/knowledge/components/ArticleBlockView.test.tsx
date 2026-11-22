import { screen } from '@testing-library/react-native';

import { renderWithProviders } from '@/testing/renderWithProviders';

import { ArticleBlockView } from './ArticleBlockView';

describe('ArticleBlockView', () => {
  it('akapit: tekst z pogrubieniem', async () => {
    await renderWithProviders(<ArticleBlockView block={{ type: 'paragraph', text: 'Zasiłek **100%**.' }} />);
    expect(screen.getByText('Zasiłek 100%.')).toBeOnTheScreen();
  });

  it('lista numerowana pokazuje numery, punktowana — kropki', async () => {
    await renderWithProviders(<ArticleBlockView block={{ type: 'list', ordered: true, items: ['Pierwszy', 'Drugi'] }} />);
    expect(screen.getByText('1.')).toBeOnTheScreen();
    expect(screen.getByText('2.')).toBeOnTheScreen();
    expect(screen.getByText('Drugi')).toBeOnTheScreen();
  });

  it('słowniczek: pojęcie i wyjaśnienie', async () => {
    await renderWithProviders(
      <ArticleBlockView block={{ type: 'glossary', entries: [{ term: 'Płatnik', definition: 'Pracodawca.' }] }} />,
    );
    expect(screen.getByText('Płatnik')).toBeOnTheScreen();
    expect(screen.getByText('Pracodawca.')).toBeOnTheScreen();
  });

  it('ramki „WAŻNE!” i „Przykład” mają swoje nagłówki', async () => {
    await renderWithProviders(
      <>
        <ArticleBlockView block={{ type: 'important', text: 'Termin 21 dni.' }} />
        <ArticleBlockView block={{ type: 'example', text: 'Pani Anna…' }} />
      </>,
    );
    expect(screen.getByText('WAŻNE!')).toBeOnTheScreen();
    expect(screen.getByText('Termin 21 dni.')).toBeOnTheScreen();
    expect(screen.getByText('Przykład')).toBeOnTheScreen();
  });

  it('tabela: każdy wiersz z podpisami kolumn', async () => {
    await renderWithProviders(
      <ArticleBlockView
        block={{
          type: 'table',
          header: ['Liczba dzieci', 'Wymiar'],
          rows: [
            ['1', '20 tygodni'],
            ['2', '31 tygodni'],
          ],
        }}
      />,
    );
    expect(screen.getAllByText('Liczba dzieci')).toHaveLength(2);
    expect(screen.getAllByText('Wymiar')).toHaveLength(2);
    expect(screen.getByText('31 tygodni')).toBeOnTheScreen();
  });
});
