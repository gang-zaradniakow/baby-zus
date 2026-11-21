import { LEGAL_PARAMS } from '@/data/legalParams';

import { describeParamChanges } from './describeParamChanges';
import { EDITABLE_PARAM_GROUPS } from './editableParams';

const fields = EDITABLE_PARAM_GROUPS.flatMap((g) => g.fields);
const field = (id: string) => fields.find((f) => f.id === id)!;

describe('EDITABLE_PARAM_GROUPS', () => {
  it('unikalne identyfikatory pól', () => {
    expect(new Set(fields.map((f) => f.id)).size).toBe(fields.length);
  });

  it('każde pole czyta i zapisuje swój parametr, nie ruszając innych', () => {
    for (const f of fields) {
      const changed = f.set(LEGAL_PARAMS, f.get(LEGAL_PARAMS) + 1);
      expect(f.get(changed)).toBe(f.get(LEGAL_PARAMS) + 1);
      expect(describeParamChanges(LEGAL_PARAMS, changed).split('; ')).toHaveLength(1);
    }
  });

  it('zagnieżdżone pola i lista tygodni', () => {
    expect(field('rates.parental').get(LEGAL_PARAMS)).toBe(0.7);
    expect(field('maternityWeeks.1').set(LEGAL_PARAMS, 32).maternityWeeks).toEqual([20, 32, 33, 35, 37]);
  });
});

describe('describeParamChanges', () => {
  it('opis zmian z polskim przecinkiem; bez zmian — pusty', () => {
    const changed = field('rates.parental').set(LEGAL_PARAMS, 0.75);
    expect(describeParamChanges(LEGAL_PARAMS, changed)).toBe('Urlop rodzicielski: 0,7 → 0,75');
    expect(describeParamChanges(LEGAL_PARAMS, LEGAL_PARAMS)).toBe('');
  });
});
