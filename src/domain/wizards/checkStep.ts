import type { StepIssue, WizardAnswers, WizardContext, WizardStep } from './Wizard';
import { error } from './wizardAnswers';

/** Czy można przejść dalej: wybór jest obowiązkowy, potem reguły kroku (błąd blokuje, ostrzeżenie nie). */
export function checkStep(step: WizardStep, answers: WizardAnswers, ctx: WizardContext): StepIssue | null {
  if (step.kind === 'choice' && !answers[step.id]) {
    return error('Wybierz jedną z odpowiedzi, byśmy mogli przejść dalej.');
  }
  return step.validate?.(answers, ctx) ?? null;
}
