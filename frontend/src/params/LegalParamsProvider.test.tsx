import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { LEGAL_PARAMETERS_2026 } from '@/api/__fixtures__/legalParameters2026';
import { resetApiConfigForTests } from '@/api/apiConfig';
import { LEGAL_PARAMS } from '@/data/legalParams';

import { LegalParamsProvider } from './LegalParamsProvider';
import { useLegalParams } from './useLegalParams';

const realFetch = globalThis.fetch;
const wrapper = ({ children }: { children: ReactNode }) => <LegalParamsProvider>{children}</LegalParamsProvider>;

/** Serwer z parametrami 2026, ale stopą rodzicielskiego zmienioną na 0,75 (żeby odróżnić od lokalnych). */
const serverResponse = {
  ...LEGAL_PARAMETERS_2026,
  version: 2,
  parameters: LEGAL_PARAMETERS_2026.parameters.map((p) => (p.key === 'PARENTAL_LEAVE_RATE' ? { ...p, value: 0.75 } : p)),
};

function serveWith(response: () => Promise<Partial<Response>>) {
  globalThis.fetch = jest.fn(async () => (await response()) as Response) as typeof fetch;
}

beforeEach(() => {
  resetApiConfigForTests();
  process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
});

afterEach(() => {
  globalThis.fetch = realFetch;
  process.env.EXPO_PUBLIC_API_URL = '';
  resetApiConfigForTests();
});

describe('LegalParamsProvider', () => {
  it('pobiera parametry z serwera i podaje je kalkulatorom', async () => {
    serveWith(async () => ({ ok: true, json: async () => serverResponse }));
    const { result } = await renderHook(() => useLegalParams(), { wrapper });

    await waitFor(() => expect(result.current.source.kind).toBe('server'));

    expect(result.current.params.rates.parental).toBe(0.75);
    expect(result.current.source).toMatchObject({ version: 2, validFrom: '2026-01-01' });
    expect(globalThis.fetch).toHaveBeenCalledWith('https://api.test/api/v1/legal-parameters', expect.anything());
  });

  it('błąd serwera — zostają parametry lokalne', async () => {
    serveWith(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    const { result } = await renderHook(() => useLegalParams(), { wrapper });

    await waitFor(() => expect(result.current.source.kind).toBe('local'));
    expect(result.current.params).toBe(LEGAL_PARAMS);
  });

  it('zmiana w panelu nakłada się na wartości z serwera, „przywróć” wraca do serwera', async () => {
    serveWith(async () => ({ ok: true, json: async () => serverResponse }));
    const { result } = await renderHook(() => useLegalParams(), { wrapper });
    await waitFor(() => expect(result.current.source.kind).toBe('server'));

    await act(() => result.current.save({ ...result.current.params, minWage: 5000 }, 'Płaca minimalna: 4806 → 5000'));
    expect(result.current).toMatchObject({ isChanged: true, params: { minWage: 5000, rates: { parental: 0.75 } } });

    await act(() => result.current.reset());
    expect(result.current.isChanged).toBe(false);
    expect(result.current.params).toBe(result.current.defaults);
    expect(result.current.params.rates.parental).toBe(0.75);
  });
});
