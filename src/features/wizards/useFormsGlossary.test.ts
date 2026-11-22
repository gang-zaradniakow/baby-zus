import { renderHook, waitFor } from '@testing-library/react-native';

import { FORMS_GLOSSARY } from '@/data/wizards/formsGlossary';

import { useFormsGlossary } from './useFormsGlossary';

describe('useFormsGlossary', () => {
  it('pokazuje słowniczek z backendu', async () => {
    const forms = [{ code: 'ZAM', description: 'Wniosek z backendu' }];
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ forms }) });

    const { result } = await renderHook(useFormsGlossary);

    await waitFor(() => expect(result.current).toEqual(forms));
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/api\/v1\/content\/forms$/), expect.anything());
  });

  it('bez backendu pokazuje słowniczek lokalny', async () => {
    const { result } = await renderHook(useFormsGlossary);
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(result.current).toBe(FORMS_GLOSSARY);
  });
});
