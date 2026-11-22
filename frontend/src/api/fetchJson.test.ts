import { normalizeApiUrl, resetApiConfigForTests } from './apiConfig';
import { ApiError } from './ApiError';
import { fetchJson } from './fetchJson';

const realFetch = globalThis.fetch;
const realEnv = process.env.EXPO_PUBLIC_API_URL;

function mockFetch(handler: (url: string) => Partial<Response> & { json?: () => Promise<unknown> }) {
  globalThis.fetch = jest.fn(async (input: RequestInfo | URL) => handler(String(input)) as Response) as typeof fetch;
}

beforeEach(() => {
  resetApiConfigForTests();
  process.env.EXPO_PUBLIC_API_URL = 'https://api.test/zus/';
});

afterEach(() => {
  globalThis.fetch = realFetch;
  process.env.EXPO_PUBLIC_API_URL = realEnv;
});

describe('normalizeApiUrl', () => {
  it('ucina końcowe ukośniki; pusty i niepodstawiony przez envsubst adres → null', () => {
    expect(normalizeApiUrl('https://x.pl/api/baby-zus-backend/')).toBe('https://x.pl/api/baby-zus-backend');
    expect(normalizeApiUrl('  ')).toBeNull();
    expect(normalizeApiUrl('${API_URL}')).toBeNull();
    expect(normalizeApiUrl(undefined)).toBeNull();
  });
});

describe('fetchJson', () => {
  it('składa adres z konfiguracji i parametry zapytania (bez pustych)', async () => {
    mockFetch(() => ({ ok: true, json: async () => ({ ok: 1 }) }));

    await expect(fetchJson('/api/v1/deadlines', { query: { event: '2026-12-03', days: 21, months: undefined } })).resolves.toEqual({ ok: 1 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/zus/api/v1/deadlines?event=2026-12-03&days=21',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('problem RFC 9457 → ApiError z kodem i łagodnym komunikatem', async () => {
    mockFetch(() => ({
      ok: false,
      status: 400,
      json: async () => ({ status: 400, code: 'validation-failed', gentleMessage: 'Sprawdź dane.' }),
    }));

    await expect(fetchJson('/api/v1/deadlines')).rejects.toMatchObject({
      kind: 'http',
      status: 400,
      code: 'validation-failed',
      gentleMessage: 'Sprawdź dane.',
    });
  });

  it('brak sieci → ApiError „network” z domyślnym komunikatem', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as typeof fetch;

    const error = await fetchJson('/api/v1/ping').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'network', gentleMessage: expect.stringMatching(/Pokazujemy wyliczenia z aplikacji/) });
  });

  it('bez adresu API — „notConfigured”, bez wywołania sieci', async () => {
    process.env.EXPO_PUBLIC_API_URL = '';
    globalThis.fetch = jest.fn() as typeof fetch;

    await expect(fetchJson('/api/v1/ping')).rejects.toMatchObject({ kind: 'notConfigured' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
