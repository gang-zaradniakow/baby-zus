import type { CalculatorSituation } from '@/domain/calculator/CalculatorSituation';
import type { CalculatorVariant } from '@/domain/knowledge/Article';

/** Polskie wartości parametru `?sytuacja=` w adresie kalkulatora. */
const PARAM_TO_SITUATION: Record<string, CalculatorSituation> = {
  ciaza: 'pregnancy',
  porod: 'birth',
  adopcja: 'adoption',
};

const ARTICLE_TO_PARAM: Record<CalculatorVariant, string> = {
  ciaza: 'ciaza',
  birth: 'porod',
  adopt: 'adopcja',
};

/** `?sytuacja=ciaza` → `pregnancy`; nieznana albo brak — `undefined` (domyślna z ankiety). */
export function situationFromParam(param: string | string[] | undefined): CalculatorSituation | undefined {
  const value = Array.isArray(param) ? param[0] : param;
  return value ? PARAM_TO_SITUATION[value] : undefined;
}

/** Adres kalkulatora dla przycisku „Policz” w artykule Wiedzy. */
export function calculatorHref(variant: CalculatorVariant): string {
  return `/kalkulator?sytuacja=${ARTICLE_TO_PARAM[variant]}`;
}
