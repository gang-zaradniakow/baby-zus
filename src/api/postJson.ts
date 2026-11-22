import { fetchJson } from './fetchJson';

/** POST z ciałem JSON na ścieżkę backendu i odczyt odpowiedzi JSON. */
export function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return fetchJson<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
}
