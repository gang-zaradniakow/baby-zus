/** Kontrakt tytułów ubezpieczenia jednej osoby (openapi.yaml: InsuranceTitlesRequest). Kwoty — `Money` ("4147.10"). */
export type InsuranceTitlesRequest = {
  employment?: { base: string; atLeastMinimumWage?: boolean };
  mandateContract?: { base: string; voluntarySickness: boolean; student?: boolean };
  selfEmployment?: { base: string; voluntarySickness: boolean; startupRelief?: boolean; debt?: string };
  agriculturalInsurance?: boolean;
};

/** openapi.yaml: InsuranceTitle. */
export type InsuranceTitleDto = 'EMPLOYMENT' | 'MANDATE_CONTRACT' | 'SELF_EMPLOYMENT';

/** openapi.yaml: Check. */
export type CheckDto = { level: 'OK' | 'INFO' | 'NO'; message: string };
