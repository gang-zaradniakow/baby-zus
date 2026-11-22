/** Błąd odpowiedzi backendu (problem RFC 9457): `code` jest stały, `gentleMessage` można pokazać użytkownikowi. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    readonly gentleMessage: string | undefined,
  ) {
    super(`API ${status}${code ? ` (${code})` : ''}`);
    this.name = 'ApiError';
  }
}
