import { day } from '@/testing/dates';

import { letterToText } from './letterToText';

describe('letterToText', () => {
  it('miejsce i data, nadawca, adresat, tytuł, treść, załączniki i podpis', () => {
    const text = letterToText(
      {
        to: 'Pracodawca — dział kadr',
        heading: ['WNIOSEK', 'o udzielenie urlopu ojcowskiego'],
        paragraphs: ['Wnoszę o udzielenie urlopu.'],
        attachments: ['Odpis aktu urodzenia'],
      },
      'Jan Przykładowy',
      day(2026, 11, 23),
    );

    expect(text.split('\n')).toEqual([
      'Warszawa, 23.11.2026',
      '',
      'Jan Przykładowy',
      '',
      'Pracodawca — dział kadr',
      '',
      'WNIOSEK',
      'o udzielenie urlopu ojcowskiego',
      '',
      'Wnoszę o udzielenie urlopu.',
      '',
      '',
      'Załączniki:',
      '1. Odpis aktu urodzenia',
      '',
      '..........................................',
      'podpis',
    ]);
  });
});
