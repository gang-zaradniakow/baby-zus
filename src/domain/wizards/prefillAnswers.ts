import type { WizardAnswers, WizardContext, WizardStep } from './Wizard';

/** Odpowiedzi startowe z profilu (np. data urodzenia, liczba dzieci); puste pomijamy. */
export function prefillAnswers(steps: readonly WizardStep[], ctx: WizardContext): WizardAnswers {
  const answers: Record<string, string> = {};
  for (const step of steps) {
    const value = step.prefill?.(ctx);
    if (value) answers[step.id] = value;
  }
  return answers;
}
