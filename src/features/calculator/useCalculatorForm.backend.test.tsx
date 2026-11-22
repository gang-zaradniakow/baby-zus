import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { LegalParamsProvider } from '@/params';
import { SessionProvider } from '@/session';

import { useCalculatorForm } from './useCalculatorForm';

const wrapper = ({ children }: { children: ReactNode }) => (
  <LegalParamsProvider>
    <SessionProvider>{children}</SessionProvider>
  </LegalParamsProvider>
);

const BACKEND = {
  checks: [{ level: 'INFO', message: 'Wyjaśnienie z backendu' }],
  parts: [{ title: 'EMPLOYMENT', label: 'Zasiłek chorobowy (z backendu)', days: 30, rate: 1, amount: '1234.00' }],
  total: '1234.00',
  netTotal: '1086.00',
};

/** Backend odpowiada tylko na L4 w ciąży; parametry prawne zostają lokalne. */
function mockSicknessBackend() {
  (globalThis.fetch as jest.Mock).mockImplementation((url: string) =>
    url.endsWith('/api/v1/calculations/sickness-in-pregnancy')
      ? Promise.resolve({ ok: true, json: async () => BACKEND })
      : Promise.reject(new Error('Brak sieci')),
  );
}

const sicknessCalls = () =>
  (globalThis.fetch as jest.Mock).mock.calls.filter(([url]) => String(url).endsWith('/sickness-in-pregnancy'));

describe('useCalculatorForm — L4 w ciąży z backendu', () => {
  afterEach(() => (globalThis.fetch as jest.Mock).mockImplementation(() => Promise.reject(new Error('Brak sieci'))));

  it('najpierw wynik lokalny, potem kwoty i wyjaśnienia z backendu', async () => {
    mockSicknessBackend();
    const { result } = await renderHook(() => useCalculatorForm('pregnancy'), { wrapper });

    await waitFor(() => expect(result.current.result.kind === 'pregnancy' && result.current.result.netTotal).toBe(1086));
    const calculation = result.current.result;
    if (calculation.kind !== 'pregnancy') throw new Error('oczekiwano L4 w ciąży');
    expect(calculation.sickPay.parts.map((p) => p.label)).toEqual(['Zasiłek chorobowy (z backendu)']);
    expect(calculation.checks).toEqual([{ level: 'info', text: 'Wyjaśnienie z backendu' }]);

    const [, init] = sicknessCalls()[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toMatchObject({ days: expect.any(Number), titles: expect.any(Object) });
  });

  it('po zmianie formularza wraca do wyniku lokalnego, dopóki backend nie odpowie', async () => {
    mockSicknessBackend();
    const { result } = await renderHook(() => useCalculatorForm('pregnancy'), { wrapper });
    await waitFor(() => expect(result.current.result.kind === 'pregnancy' && result.current.result.netTotal).toBe(1086));

    await act(() => result.current.patchPregnancy({ days: 10 }));
    expect(result.current.result.kind === 'pregnancy' && result.current.result.netTotal).not.toBe(1086);
  });
});
