import { splitBoldSegments } from './splitBoldSegments';

describe('splitBoldSegments', () => {
  it('tekst bez znaczników to jeden zwykły kawałek', () => {
    expect(splitBoldSegments('Zasiłek 100%')).toEqual([{ text: 'Zasiłek 100%', bold: false }]);
  });

  it('wydziela pogrubienia', () => {
    expect(splitBoldSegments('Płatnik **21 osób** i **więcej**.')).toEqual([
      { text: 'Płatnik ', bold: false },
      { text: '21 osób', bold: true },
      { text: ' i ', bold: false },
      { text: 'więcej', bold: true },
      { text: '.', bold: false },
    ]);
  });

  it('pogrubienie na początku nie daje pustego kawałka', () => {
    expect(splitBoldSegments('**Uwaga** — termin')).toEqual([
      { text: 'Uwaga', bold: true },
      { text: ' — termin', bold: false },
    ]);
  });

  it('niedomknięty znacznik zostaje zwykłym tekstem', () => {
    expect(splitBoldSegments('a **b')).toEqual([
      { text: 'a ', bold: false },
      { text: '**b', bold: false },
    ]);
  });
});
