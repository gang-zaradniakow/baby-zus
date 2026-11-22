import { resolveApiBaseUrl } from './apiConfig';
import { ApiError, DEFAULT_GENTLE_MESSAGE } from './ApiError';
import type { ProblemDetail } from './apiTypes';

/** Po tylu ms przerywamy zapytanie — lepiej szybko pokazać wyliczenie lokalne niż kręcić kółkiem. */
export const API_TIMEOUT_MS = 8000;

type Query = Record<string, string | number | undefined>;

/** Opcje `fetch` (np. `method`, `body`, `signal` dla POST) plus parametry zapytania doklejane do adresu. */
export type FetchJsonOptions = RequestInit & { query?: Query };

function toQueryString(query: Query): string {
  const pairs = Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return pairs.length ? `?${pairs.join('&')}` : '';
}

async function problemFrom(response: Response): Promise<ApiError> {
  try {
    const problem = (await response.json()) as Partial<ProblemDetail>;
    return new ApiError('http', problem.gentleMessage ?? DEFAULT_GENTLE_MESSAGE, response.status, problem.code);
  } catch {
    return new ApiError('http', DEFAULT_GENTLE_MESSAGE, response.status);
  }
}

/**
 * Zapytanie do backendu (`/api/v1/...`) i odczyt JSON. Rzuca `ApiError`: `notConfigured` (brak adresu),
 * `timeout`, `network` albo `http` z kodem i łagodnym komunikatem z problemu RFC 9457.
 * `signal` wywołującego (np. anulowanie przy zmianie formularza) przerywa zapytanie tak samo jak timeout.
 */
export async function fetchJson<T>(path: string, { query = {}, signal, headers, ...init }: FetchJsonOptions = {}): Promise<T> {
  const baseUrl = await resolveApiBaseUrl();
  if (!baseUrl) throw new ApiError('notConfigured');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  try {
    const response = await fetch(`${baseUrl}${path}${toQueryString(query)}`, {
      ...init,
      headers: { Accept: 'application/json', ...headers },
      signal: controller.signal,
    });
    if (!response.ok) throw await problemFrom(response);
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(controller.signal.aborted ? 'timeout' : 'network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
