import { LEGAL_PARAMS, type LegalParams } from '@/data/legalParams';

/**
 * Zasiłek „na rękę”: brutto minus zaokrąglona zaliczka PIT (orientacyjnie 12%, bez kwoty
 * zmniejszającej). Od zasiłku nie pobiera się składki zdrowotnej.
 */
export function toNetAmount(gross: number, params: LegalParams = LEGAL_PARAMS): number {
  return gross - Math.round(gross * params.pitRate);
}
