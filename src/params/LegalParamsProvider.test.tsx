import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { legalParametersFixture } from '@/api/legalParameters/legalParametersFixture';
import { LEGAL_PARAMS } from '@/data/legalParams';

import { LegalParamsProvider } from './LegalParamsProvider';
import { useLegalParams } from './useLegalParams';

const wrapper = ({ children }: { children: ReactNode }) => <LegalParamsProvider>{children}</LegalParamsProvider>;

/** Backend odpowiada parametrami 2026 z inną płacą minimalną, żeby odróżnić je od lokalnych. */
function mockBackend(minWage: number) {
  const response = {
    ...legalParametersFixture,
    parameters: legalParametersFixture.parameters.map((p) => (p.key === 'MINIMUM_WAGE' ? { ...p, value: minWage } : p)),
  };
  (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => response });
}

describe('LegalParamsProvider', () => {
  it('bez backendu liczy z parametrów lokalnych', async () => {
    const { result } = await renderHook(useLegalParams, { wrapper });
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(result.current.params).toBe(LEGAL_PARAMS);
  });

  it('po odpowiedzi backendu liczy z jego parametrów', async () => {
    mockBackend(5000);
    const { result } = await renderHook(useLegalParams, { wrapper });

    await waitFor(() => expect(result.current.params.minWage).toBe(5000));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/legal-parameters$/),
      expect.anything(),
    );
    expect(result.current.isChanged).toBe(false);
  });

  it('zmiana z Panelu nadpisuje backend, a przywrócenie wraca do jego wartości', async () => {
    mockBackend(5000);
    const { result } = await renderHook(useLegalParams, { wrapper });
    await waitFor(() => expect(result.current.params.minWage).toBe(5000));

    await act(() => result.current.save({ ...result.current.params, minWage: 6000 }, 'Płaca minimalna: 5000 → 6000'));
    expect(result.current.params.minWage).toBe(6000);
    expect(result.current.isChanged).toBe(true);

    await act(() => result.current.reset());
    expect(result.current.params.minWage).toBe(5000);
    expect(result.current.isChanged).toBe(false);
  });
});
