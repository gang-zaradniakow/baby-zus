import type { CheckDto, InsuranceTitleDto, InsuranceTitlesRequest } from './InsuranceTitlesRequest';

/** Kontrakt `POST /api/v1/calculations/sickness-in-pregnancy` (openapi.yaml: PregnancySicknessRequest). */
export type PregnancySicknessRequest = {
  titles: InsuranceTitlesRequest;
  days: number;
  usedSickPayDays?: number;
  aged50OrMore?: boolean;
  insuredDays?: number;
};

/** openapi.yaml: SicknessPayPart. */
export type SicknessPayPartDto = {
  title: InsuranceTitleDto;
  label: string;
  days: number;
  rate: number;
  amount: string;
};

/** openapi.yaml: PregnancySickness. */
export type PregnancySicknessResponse = {
  checks: CheckDto[];
  parts: SicknessPayPartDto[];
  total: string;
  netTotal: string;
};
