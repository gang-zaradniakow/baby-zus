/**
 * Typy odpowiedzi backendu — przepisane z kontraktu `openapi.yaml` (baby-zus-backend,
 * src/main/resources/openapi/openapi.yaml, wersja 0.1.0). Daty jako ISO `RRRR-MM-DD`.
 */

export type LegalParameterKind = 'AMOUNT' | 'RATE' | 'WEEKS' | 'DAYS' | 'MONTHS' | 'YEARS' | 'WEEKS_BY_CHILDREN';

export type LegalParameterDto = {
  key: string;
  kind: LegalParameterKind;
  label: string;
  /** Rodzaje jednowartościowe. */
  value?: number;
  /** `WEEKS_BY_CHILDREN`: dla 1, 2, 3, 4 i 5+ dzieci. */
  values?: number[];
};

export type LegalParametersResponse = {
  version: number;
  validFrom: string;
  description: string;
  parameters: LegalParameterDto[];
};

export type DeadlineType = 'AFTER' | 'BEFORE';

export type DeadlineDto = {
  type: DeadlineType;
  raw: string;
  legal: string;
  shifted: boolean;
  /** Nazwa święta, „sobota”, „niedziela” — pole pomijane, gdy brak. */
  reason?: string;
  safe: string;
};

/** Problem RFC 9457 z polami aplikacji. */
export type ProblemDetail = {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  code: string;
  gentleMessage: string;
  errors?: { field: string; message: string }[];
};
