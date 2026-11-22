import type { SickPayPart } from '@/domain/calculator/pregnancySickPay';
import type { CalcCheck } from '@/domain/calculator/CalcCheck';

import type { PregnancySicknessResponse } from './PregnancySickness';
import { toCalcCheck } from './toCalcCheck';

export type BackendSickPay = {
  checks: CalcCheck[];
  parts: SickPayPart[];
  total: number;
  /** Na rękę — liczone przez backend. */
  netTotal: number;
};

/** Odpowiedź backendu (kwoty jako tekst) → model wyniku kalkulatora. */
export function fromPregnancySickness(response: PregnancySicknessResponse): BackendSickPay {
  return {
    checks: response.checks.map(toCalcCheck),
    parts: response.parts.map((part) => ({
      label: part.label,
      days: part.days,
      rate: Number(part.rate),
      amount: Number(part.amount),
    })),
    total: Number(response.total),
    netTotal: Number(response.netTotal),
  };
}
