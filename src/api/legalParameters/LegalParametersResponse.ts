/** Kontrakt `GET /api/v1/legal-parameters` (openapi.yaml: LegalParametersResponse). */
export type LegalParameterKind = 'AMOUNT' | 'RATE' | 'WEEKS' | 'DAYS' | 'MONTHS' | 'YEARS' | 'WEEKS_BY_CHILDREN';

export type LegalParameterDto = {
  key: string;
  kind: LegalParameterKind;
  label: string;
  /** Parametry jednowartościowe. */
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
