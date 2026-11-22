/** Domyślny łagodny komunikat, gdy backend nie podał własnego albo jest nieosiągalny. */
export const DEFAULT_GENTLE_MESSAGE = 'Nie udało się połączyć z serwerem ZUS baby. Pokazujemy wyliczenia z aplikacji.';

/**
 * Błąd wywołania API: brak połączenia, przekroczony czas albo problem RFC 9457 z backendu
 * (`code` — stały kod dla aplikacji, `gentleMessage` — polski tekst do pokazania użytkownikowi).
 */
export class ApiError extends Error {
  constructor(
    readonly kind: 'network' | 'timeout' | 'http' | 'notConfigured',
    readonly gentleMessage: string = DEFAULT_GENTLE_MESSAGE,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(`${kind}${status ? ` ${status}` : ''}${code ? ` ${code}` : ''}`);
    this.name = 'ApiError';
  }
}
