import { LEGAL_PARAMS } from '@/data/legalParams';

import { legalParametersFixture } from './legalParametersFixture';
import { toLegalParams } from './toLegalParams';

describe('toLegalParams', () => {
  it('odpowiedź backendu dla 2026 daje te same parametry co lokalne wartości domyślne', () => {
    expect(toLegalParams(legalParametersFixture)).toEqual(LEGAL_PARAMS);
  });

  it('brak klucza to błąd kontraktu', () => {
    const response = {
      ...legalParametersFixture,
      parameters: legalParametersFixture.parameters.filter((p) => p.key !== 'MINIMUM_WAGE'),
    };
    expect(() => toLegalParams(response)).toThrow('MINIMUM_WAGE');
  });

  it('parametr wg liczby dzieci bez listy wartości to błąd kontraktu', () => {
    const response = {
      ...legalParametersFixture,
      parameters: legalParametersFixture.parameters.map((p) =>
        p.key === 'MATERNITY_LEAVE_WEEKS' ? { ...p, values: undefined } : p,
      ),
    };
    expect(() => toLegalParams(response)).toThrow('MATERNITY_LEAVE_WEEKS');
  });
});
