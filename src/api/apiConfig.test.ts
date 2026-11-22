import { Platform } from 'react-native';

import { resetApiConfigForTests, resolveApiBaseUrl } from './apiConfig';

const realFetch = globalThis.fetch;
const PROD_FROM_ENV = 'https://prod.hack.kulesz.pl/api/baby-zus-backend';

function serveConfig(response: Partial<Response> | Error) {
  globalThis.fetch = jest.fn(async () => {
    if (response instanceof Error) throw response;
    return response as Response;
  }) as typeof fetch;
}

beforeEach(() => {
  resetApiConfigForTests();
  process.env.EXPO_PUBLIC_API_URL = PROD_FROM_ENV;
});

afterEach(() => {
  jest.restoreAllMocks();
  globalThis.fetch = realFetch;
  process.env.EXPO_PUBLIC_API_URL = '';
  resetApiConfigForTests();
});

describe('resolveApiBaseUrl — web', () => {
  beforeEach(() => jest.replaceProperty(Platform, 'OS', 'web'));

  it('kontener TEST: adres z /config.json, nie z .env', async () => {
    serveConfig({ ok: true, json: async () => ({ apiUrl: 'https://test.hack.kulesz.pl/api/baby-zus-backend' }) });
    await expect(resolveApiBaseUrl()).resolves.toBe('https://test.hack.kulesz.pl/api/baby-zus-backend');
  });

  it('kontener bez API_URL: pusty /config.json → bez backendu (nie spada na PROD z .env)', async () => {
    serveConfig({ ok: true, json: async () => ({ apiUrl: '' }) });
    await expect(resolveApiBaseUrl()).resolves.toBeNull();
  });

  it('lokalny expo start: brak /config.json (404 albo strona HTML) → adres z .env', async () => {
    serveConfig({ ok: false, status: 404 });
    await expect(resolveApiBaseUrl()).resolves.toBe(PROD_FROM_ENV);

    resetApiConfigForTests();
    serveConfig({ ok: true, json: async () => JSON.parse('<!doctype html>') });
    await expect(resolveApiBaseUrl()).resolves.toBe(PROD_FROM_ENV);
  });

  it('adres zapamiętany — /config.json pobierany raz', async () => {
    serveConfig({ ok: true, json: async () => ({ apiUrl: 'https://x.pl/api' }) });
    await resolveApiBaseUrl();
    await resolveApiBaseUrl();
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('resolveApiBaseUrl — aplikacja mobilna', () => {
  it('bez /config.json — adres z .env (PROD w buildzie produkcyjnym), bez zapytania o config', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    globalThis.fetch = jest.fn() as typeof fetch;

    await expect(resolveApiBaseUrl()).resolves.toBe(PROD_FROM_ENV);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});
