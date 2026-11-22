import { API_BASE_URL } from './apiBaseUrl';
import { ApiError } from './ApiError';

type Problem = { code?: string; gentleMessage?: string };

/** Zapytanie do ścieżki backendu (np. `/api/v1/ping`) i odczyt JSON. Odpowiedź inna niż 2xx kończy się `ApiError`. */
export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { Accept: 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const problem: Problem = await response.json().catch(() => ({}));
    throw new ApiError(response.status, problem.code, problem.gentleMessage);
  }
  return (await response.json()) as T;
}
