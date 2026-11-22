import { LEGAL_PARAMS } from '@/data/legalParams';

import { LEGAL_PARAMETERS_2026 } from './__fixtures__/legalParameters2026';
import { mapLegalParameters, REQUIRED_PARAMETER_KEYS } from './mapLegalParameters';

describe('mapLegalParameters', () => {
  it('odpowiedź backendu dla 2026 daje dokładnie lokalne parametry — mapowanie kompletne', () => {
    const mapped = mapLegalParameters(LEGAL_PARAMETERS_2026);

    expect(mapped.params).toEqual(LEGAL_PARAMS);
    expect(mapped.missingKeys).toEqual([]);
    expect(mapped).toMatchObject({ version: 1, validFrom: '2026-01-01' });
  });

  it('nowa wartość z serwera trafia do właściwego pola, reszta bez zmian', () => {
    const changed = {
      ...LEGAL_PARAMETERS_2026,
      parameters: LEGAL_PARAMETERS_2026.parameters.map((p) =>
        p.key === 'PARENTAL_LEAVE_RATE' ? { ...p, value: 0.8 } : p.key === 'MINIMUM_WAGE' ? { ...p, value: 5000 } : p,
      ),
    };
    const { params } = mapLegalParameters(changed);

    expect(params.rates.parental).toBe(0.8);
    expect(params.minWage).toBe(5000);
    expect(params.rates.maternity).toBe(1);
  });

  it('brakujący albo zły parametr — zostaje wartość lokalna i trafia na listę braków', () => {
    const partial = {
      ...LEGAL_PARAMETERS_2026,
      parameters: [
        ...LEGAL_PARAMETERS_2026.parameters.filter((p) => p.key !== 'FUNERAL_GRANT' && p.key !== 'MATERNITY_LEAVE_WEEKS'),
        { key: 'MATERNITY_LEAVE_WEEKS', kind: 'WEEKS_BY_CHILDREN' as const, label: '', values: [20, 31] },
      ],
    };
    const mapped = mapLegalParameters(partial);

    expect(mapped.params.funeralAllowance).toBe(7000);
    expect(mapped.params.maternityWeeks).toEqual([20, 31, 33, 35, 37]);
    expect(mapped.missingKeys).toEqual(expect.arrayContaining(['FUNERAL_GRANT', 'MATERNITY_LEAVE_WEEKS']));
  });

  it('nieznane klucze (np. zasiłek opiekuńczy) są pomijane bez błędu', () => {
    expect(REQUIRED_PARAMETER_KEYS).not.toContain('CARE_BENEFIT_RATE');
    expect(() => mapLegalParameters(LEGAL_PARAMETERS_2026)).not.toThrow();
  });
});
