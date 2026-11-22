import type { WizardAnswers, WizardStep } from './Wizard';

/** Odpowiedź do podsumowania „Sprawdź i zatwierdź”: etykieta wyboru, liczba z jednostką, „—” gdy brak. */
export function describeAnswer(step: WizardStep, answers: WizardAnswers): string {
  const value = answers[step.id];
  switch (step.kind) {
    case 'choice':
      return step.options.find((o) => o.value === value)?.label ?? '—';
    case 'number':
      return value ? `${value}${step.unit ? ` ${step.unit}` : ''}` : '—';
    case 'document':
      return value === 'yes' ? 'Dołączę' : 'Dołączę później';
    case 'info':
      return '';
    case 'date':
      return value || '—';
  }
}
